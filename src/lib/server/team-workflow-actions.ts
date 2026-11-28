import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getActiveEditorialActor } from "./editorial-auth";
import { getSupabaseServerClient } from "../supabase/server";

const command = createServerOnlyFn(async (data: {action:"submit"|"approve"|"reject"|"publish"|"unpublish";teamId:string;expectedUpdatedAt:string;note?:string})=>{
 const actor=await getActiveEditorialActor();
 if(!actor)return {ok:false as const,code:"unauthenticated" as const};
 if(data.action==="submit" ? !["editor","publisher","administrator"].includes(actor.role) : !["publisher","administrator"].includes(actor.role)) return {ok:false as const,code:"forbidden" as const};
 const supabase=getSupabaseServerClient(); if(!supabase)return {ok:false as const,code:"not-configured" as const};
 const payload=data.action==="reject"?{note:data.note}:{};
 const {data:result,error}=await supabase.rpc("team_editorial_workflow_command",{p_action:data.action,p_team_id:data.teamId,p_expected_updated_at:data.expectedUpdatedAt,p_payload:payload});
 if(error||!result||typeof result!=="object"||Array.isArray(result))return {ok:false as const,code:"internal" as const};
 const value=result as Record<string,unknown>;
 if(value.ok===true&&typeof value.updatedAt==="string"&&typeof value.status==="string")return {ok:true as const,updatedAt:value.updatedAt,status:value.status};
 const codes=["forbidden","invalid_action","invalid_payload","invalid_transition","conflict","not_found","unauthenticated"];
 return {ok:false as const,code:typeof value.code==="string"&&codes.includes(value.code)?value.code as typeof codes[number]:"internal"};
});
function isStrictIsoTimestamp(value: unknown): value is string {
 if (typeof value !== "string") return false;
 const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
 if (!match) return false;
 const [, yearText, monthText, dayText, hourText, minuteText, secondText, zone] = match;
 const year = Number(yearText), month = Number(monthText), day = Number(dayText);
 const hour = Number(hourText), minute = Number(minuteText), second = Number(secondText);
 if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return false;
 const date = new Date(0);
 date.setUTCFullYear(year, month - 1, day);
 date.setUTCHours(hour, minute, second, 0);
 if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return false;
 if (zone !== "Z") {
   const offset = /[+-](\d{2}):(\d{2})$/.exec(zone);
   if (!offset || Number(offset[1]) > 14 || Number(offset[2]) > 59\n     || (Number(offset[1]) === 14 && Number(offset[2]) !== 0)) return false;
 }
 return Number.isFinite(Date.parse(value));
}

export function isValidTeamWorkflowRequest(value:unknown):value is {action:"submit"|"approve"|"reject"|"publish"|"unpublish";teamId:string;expectedUpdatedAt:string;note?:string}{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const d=value as Record<string,unknown>; const allowed=["action","teamId","expectedUpdatedAt",...(d.action==="reject"?["note"]:[])];
 if(Object.keys(d).sort().join(",")!==allowed.sort().join(","))return false;
 if(!["submit","approve","reject","publish","unpublish"].includes(String(d.action)))return false;
 if(typeof d.teamId!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(d.teamId))return false;
 if(!isStrictIsoTimestamp(d.expectedUpdatedAt))return false;
 if(d.action==="reject"&&(typeof d.note!=="string"||!d.note.trim()||d.note.length>1000))return false;
 return true;
}
export const teamWorkflowCommandFn=createServerFn({method:"POST"}).validator((data:unknown)=>data).handler(async({data})=>isValidTeamWorkflowRequest(data)?command(data):{ok:false as const,code:"invalid" as const});

const queue=createServerOnlyFn(async()=>{
 const actor=await getActiveEditorialActor(); if(!actor)return {ok:false as const,code:"unauthenticated" as const};
 if(!["publisher","administrator"].includes(actor.role))return {ok:false as const,code:"forbidden" as const};
 const supabase=getSupabaseServerClient(); if(!supabase)return {ok:false as const,code:"not-configured" as const};
 const {data,error}=await supabase.from("teams").select("id,name,slug,category,description,editorial_status,updated_at,is_published").in("editorial_status",["in-review","approved","published"]).order("updated_at",{ascending:true});
 if(error)return {ok:false as const,code:"internal" as const};
 return {ok:true as const,items:data??[]};
});
export const teamReviewQueueFn=createServerFn({method:"GET"}).handler(async()=>queue());
