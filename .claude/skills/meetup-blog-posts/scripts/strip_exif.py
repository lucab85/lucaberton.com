"""Remove EXIF/XMP (APP1), IPTC (APP13) and comment segments from JPEGs, in place.
Phone photos carry GPS + device data; sips resizing and PNG round-trips do NOT remove it.
Usage: python3 -I strip_exif.py a.jpg b.jpg ...   (then verify: strings -a a.jpg | grep -iE "GPS|Exif")"""
import sys,struct
def strip(p):
    d=open(p,'rb').read()
    assert d[:2]==b'\xff\xd8'
    out=bytearray(d[:2]); i=2
    while i<len(d):
        if d[i]!=0xFF: out+=d[i:]; break
        m=d[i+1]
        if m==0xDA: out+=d[i:]; break          # start of scan: copy rest
        L=struct.unpack('>H',d[i+2:i+4])[0]
        seg=d[i:i+2+L]
        # drop APP1 (EXIF/XMP), APP13 (IPTC), COM; keep APP0, APP2 (ICC), APP14, all others
        if m not in (0xE1,0xED,0xFE): out+=seg
        i+=2+L
    open(p,'wb').write(out)
for p in sys.argv[1:]: strip(p)
