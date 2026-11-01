import { assetUrl } from './data/assets';
export function GreetingRig({ winking }: { winking: boolean }) {
 const base=assetUrl('assets/character/ash-approved-rig.png');
 return <svg className="greeting-rig" viewBox="0 0 1024 1536" aria-hidden="true">
 <defs>
 <clipPath id="ash-body-cut"><path d="M275 342Q300 328 338 337L345 360Q350 305 420 274L430 250Q401 214 428 128Q449 24 518 23Q619 20 635 139L625 240 660 290Q713 320 730 416L756 569 750 738 702 775 700 838 668 891 681 972 724 1140 768 1316 763 1384Q788 1498 725 1506L660 1490 650 1460 657 1355 631 1309 614 1243 564 1110 545 1010 544 1266 538 1317 539 1391Q472 1439 364 1427L355 1401 376 1368 415 1310 403 1270 371 1120 340 960 330 710 326 664 355 549 376 498Q302 587 249 511L230 459 241 407 275 367Z"/></clipPath>
 <clipPath id="ash-wave-cut"><path d="M175 261 166 241 142 220 104 146Q98 130 108 130L148 177 124 104Q117 88 128 88L170 156 142 88Q137 72 148 73L190 150 181 86Q180 70 190 73L214 149 222 176 239 138Q249 124 256 131L245 171 231 207 219 241 221 251Z"/></clipPath>
 <clipPath id="ash-v-cut"><path d="M850 250 851 222 844 191 846 161 828 91Q821 74 832 77L869 144 895 83Q902 64 911 74L894 153Q912 155 916 174L925 190 917 221 897 261Z"/></clipPath>
 <clipPath id="ash-eye-cut"><ellipse cx="530" cy="134" rx="29" ry="16"/></clipPath>
 </defs>
 <image className="rig-body" href={base} width="1024" height="1536" clipPath="url(#ash-body-cut)"/>
 <g className="rig-wave"><g transform="translate(182 171) scale(.7)"><image href={base} width="1024" height="1536" clipPath="url(#ash-wave-cut)"/></g></g>
 {/* Mirror only the victory hand around its wrist; keep the sleeve and shoulder fixed. */}
 <g className="rig-v" transform="translate(919 171) scale(-.7 .7)"><image href={base} width="1024" height="1536" clipPath="url(#ash-v-cut)"/></g>
 <image className={`ash-wink ${winking?'active':''}`} href={assetUrl('assets/character/ash-approved-rig-wink.png')} width="1024" height="1536" clipPath="url(#ash-eye-cut)"/>
 </svg>;
}
