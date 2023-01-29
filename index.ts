import type MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token";
import type StateInline from "markdown-it/lib/rules_inline/state_inline";
import type StateBlock from "markdown-it/lib/rules_block/state_block";
function render(content:string,display:boolean,displaylines:boolean):string 
{
    const sign=display?'$$':'$';content=content.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
    if(displaylines) return `${sign}\\displaylines{${content}}${sign}`;
    else return `${sign}${content}${sign}`;
}
function isValidDelim(state:StateInline,pos:number)
{
    let max=state.posMax,can_open=true,can_close=true;
    const prevChar=pos>0?state.src.charCodeAt(pos-1):-1,nextChar=pos+1<=max?state.src.charCodeAt(pos+1):-1;
    if(prevChar===0x20||prevChar===0x09||(nextChar>=0x30&&nextChar<=0x39))can_close=false;
    if(nextChar===0x20||nextChar===0x09)can_open=false;
    return {can_open:can_open,can_close:can_close,};
}
function math_inline(state:StateInline,silent:boolean) 
{
    if(state.src[state.pos]!=="$") return false;
    let res=isValidDelim(state,state.pos);
    if(!res.can_open)
    {
        if(!silent) state.pending+="$";
        state.pos+=1;
        return true;
    }
    const start=state.pos+1;
    let match=start;
    while((match=state.src.indexOf("$",match))!==-1) 
    {
        let pos=match-1;
        while(state.src[pos]==="\\") pos--;
        if((match-pos)%2==1) break;
        match+=1;
    }
    if(match===-1) 
    {
        if(!silent) state.pending+="$";
        state.pos=start;
        return true;
    }
    if (match-start===0) 
    {
        if(!silent) state.pending+="$$";
        state.pos=start+1;
        return true;
    }
    res=isValidDelim(state,match);
    if(!res.can_close) 
    {
        if(!silent) state.pending+="$";
        state.pos=start;
        return true;
    }
    if (!silent) 
    {
        const token=state.push("math_inline","math",0);
        token.markup="$";
        token.content=state.src.slice(start,match);
    }
    state.pos=match+1;
    return true;
}
function math_block(state:StateBlock,start:number,end:number,silent:boolean) 
{
    let next:number,lastPos:number;
    let found=false,pos=state.bMarks[start]+state.tShift[start],max=state.eMarks[start],lastLine="";
    if(pos+2>max) return false;
    if(state.src.slice(pos,pos+2)!=="$$") return false;
    pos+=2;
    let firstLine=state.src.slice(pos,max);
    if(silent) return true;
    if(firstLine.trim().slice(-2)==="$$") 
    {
        firstLine=firstLine.trim().slice(0,-2);
        found=true;
    }
    for(next=start;!found;) 
    {
        next++;
        if(next>=end) break;
        pos=state.bMarks[next]+state.tShift[next];
        max=state.eMarks[next];
        if(pos<max&&state.tShift[next]<state.blkIndent) break;
        if(state.src.slice(pos,max).trim().slice(-2)==="$$") 
        {
            lastPos=state.src.slice(0,max).lastIndexOf("$$");
            lastLine=state.src.slice(pos,lastPos);
            found=true;
        }
    }
    state.line=next+1;
    const token=state.push("math_block","math",0);
    token.block=true;
    token.content=(firstLine&&firstLine.trim()?firstLine+"\n":"")+state.getLines(start+1,next,state.tShift[start],true)+(lastLine&&lastLine.trim()?lastLine:"");
    token.map=[start, state.line];
    token.markup="$$";
    return true;
}
interface Option{
    inline?:boolean,
    block?:boolean
}
function math_plugin(md:MarkdownIt,options?:Option) 
{
    options=options||{};
    let inline=options.inline||false,block=options.block||true;
    md.inline.ruler.after("escape","math_inline",math_inline);
    md.block.ruler.after("blockquote","math_block",math_block,{alt:["paragraph","reference","blockquote","list"],});
    md.renderer.rules.math_inline=(tokens:Token[],idx:number)=>{return render(tokens[idx].content,false,inline)};
    md.renderer.rules.math_block=(tokens:Token[],idx:number)=>{return render(tokens[idx].content,true,block)};
};
export=math_plugin;