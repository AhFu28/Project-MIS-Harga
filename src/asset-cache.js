// Only call after staticRoute has authenticated the request.
export function authenticatedAsset(req,response){const path=new URL(req.url).pathname;
 if(!/^\/vendor\/\d+\.\d+\.\d+\/[\w./-]+$/.test(path)||![200,304].includes(response.status))return response;
 const headers=new Headers(response.headers);headers.set('Cache-Control','private, no-cache');return new Response(response.body,{status:response.status,headers});
}
