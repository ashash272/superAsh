import { assetUrl } from './data/assets';
export function GreetingRig({ winking }: { winking: boolean }) {
 const base=assetUrl('assets/character/ash-exact-approved.png');
 const victory=assetUrl('assets/character/ash-exact-victory.png');
 return <svg className="greeting-rig" viewBox="0 0 1024 1536" aria-hidden="true">
 <defs>
 <clipPath id="ash-body-cut"><path d="M299 351Q326 365 354 345L359 325Q381 285 422 271L432 246Q412 206 430 144Q453 37 518 37Q610 37 624 137L617 243 659 283Q704 302 718 401L734 553 723 578 724 694 694 760 684 811 679 850 651 876 629 859 629 800 634 764 628 738 624 748Q636 945 682 1089L746 1289 738 1327 747 1380Q767 1466 721 1478L678 1475Q647 1466 651 1418L660 1349 638 1330 617 1252 564 1108 536 977 532 1223 513 1294 523 1331 532 1368Q470 1412 366 1397L361 1377 376 1358 427 1307 432 1270 419 1263Q382 1118 357 943L334 727 335 697 322 662 356 551 376 498Q308 588 269 510L247 449 261 398 294 373Z"/></clipPath>
 <clipPath id="ash-wave-cut"><path d="M304 361 300 341 284 319 265 277Q258 262 267 261L294 299 280 245Q276 229 284 230L310 286 294 233Q289 215 299 218L326 278 320 232Q318 217 327 219L341 278 347 291 356 264Q362 253 370 257L365 287 366 313 354 344 349 363Z"/></clipPath>
 <clipPath id="ash-v-cut"><path d="M305 362 300 342Q288 329 287 307L290 293 297 288 296 278 304 272 292 233Q287 216 297 218L319 270 327 226Q327 210 337 213L341 270 347 293 351 320 348 361Z"/></clipPath>
 <clipPath id="ash-cuff-cut"><path d="M299 354Q327 368 354 351L357 382Q329 412 302 388Z"/></clipPath>
 <clipPath id="ash-eye-cut"><ellipse cx="534" cy="138" rx="26" ry="13"/></clipPath>
 </defs>
 <image className="rig-body" href={base} width="1024" height="1536" clipPath="url(#ash-body-cut)"/>
 <g className="rig-wave"><image href={base} width="1024" height="1536" clipPath="url(#ash-wave-cut)"/></g>
 <g className="rig-v"><image href={victory} width="1024" height="1536" clipPath="url(#ash-v-cut)"/></g>
 <image href={base} width="1024" height="1536" clipPath="url(#ash-cuff-cut)"/>
 <image className={`ash-wink ${winking?'active':''}`} href={victory} width="1024" height="1536" clipPath="url(#ash-eye-cut)"/>
 </svg>;
}

