import {MEDAL_PALETTES} from '@/lib/medalPalette';
export default function MedalPaletteFilters(){
 return <svg aria-hidden="true" width="0" height="0" className="pointer-events-none absolute" focusable="false"><defs>{Object.entries(MEDAL_PALETTES).map(([tier,palette])=><filter key={tier} id={'medal-palette-'+tier} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="table" tableValues={palette.r}/><feFuncG type="table" tableValues={palette.g}/><feFuncB type="table" tableValues={palette.b}/><feFuncA type="identity"/></feComponentTransfer></filter>)}</defs></svg>;
}
