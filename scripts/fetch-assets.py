import urllib.request, urllib.parse, json, pathlib, re
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'images'
OUT.mkdir(parents=True, exist_ok=True)
def get(url):
    req=urllib.request.Request(url, headers={'User-Agent':'UlyDalaEducationalMuseum/1.0 (local educational project)'})
    return urllib.request.urlopen(req, timeout=30).read()
if __name__ == '__main__':
    manifest=[]
    for name,title in [('abai.jpg','File:Abai Kunanbaev.jpg'),('shokan.jpg','File:Chokan Valikhanov portrait.jpg'),('flag.svg','File:Flag of Kazakhstan.svg'),('emblem.svg','File:Emblem of Kazakhstan latin.svg'),('satpayev.jpg','File:Kanysh Satpayev from Kazakhstanskaya Pravda 19 May 1949.jpg')]:
        try:
            url='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode({'action':'query','format':'json','titles':title,'prop':'imageinfo','iiprop':'url|extmetadata'})
            page=next(iter(json.loads(get(url))['query']['pages'].values()))
            info=page['imageinfo'][0]
            metadata=info['extmetadata']
            print(name, metadata.get('LicenseShortName',{}).get('value'), metadata.get('Artist',{}).get('value','Unknown'))
            (OUT/name).write_bytes(get(info['url'].split('?')[0]))
            manifest.append({'file':name,'page':info['descriptionurl'],'original':info['url'].split('?')[0],'metadata':metadata})
        except Exception as e: print(title, str(e))
    (OUT/'credits.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
