import openpyxl,json,re,collections,datetime
import sys
wb=openpyxl.load_workbook(sys.argv[1],read_only=True)
rows=list(wb.worksheets[0].iter_rows(values_only=True))[1:]
out=[];cnt=collections.Counter();now=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None).isoformat()+'Z'
for r in rows:
    if not any(c not in (None,'') for c in r): continue
    d,c,m,p=r[:4]
    if isinstance(d,datetime.datetime): ds=d.strftime('%Y-%m-%d')
    elif isinstance(d,(int,float)): ds=(datetime.datetime(1899,12,30)+datetime.timedelta(days=d)).strftime('%Y-%m-%d')
    else:
        s=str(d).strip()
        mt=re.match(r'(\d{1,2})[-/](\d{1,2})[-/](\d{4})',s)
        ds=f'{mt[3]}-{int(mt[2]):02d}-{int(mt[1]):02d}' if mt else s
    cl=re.sub(r'\s+',' ',str(c).strip()).title()
    cl=re.sub(r"'S\b","'s",cl)
    me=str(m).strip().title()
    pc=int(p)
    slug=re.sub(r'[^a-z0-9]+','-',cl.lower()).strip('-')[:60]
    key=(ds,cl,me,pc);cnt[key]+=1
    out.append({'op':'set','collection':'entries','doc_id':f"xl-{ds.replace('-','')}-{slug}-{me.lower()}-{pc}-{cnt[key]}",'data':{'date':ds,'client':cl,'metal':me,'pcs':pc,'createdAt':now}})
json.dump(out,open(sys.argv[2] if len(sys.argv)>2 else 'docs.json','w'))
print(len(out),min(o['data']['date'] for o in out),max(o['data']['date'] for o in out),len({o['data']['client'] for o in out}))
print(max(len(o['doc_id']) for o in out), {o['data']['metal'] for o in out})
