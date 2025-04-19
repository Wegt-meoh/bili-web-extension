export const CLASS_PREFIX = "dark-bili";
export const STYLE_SELECTOR = "style:not([class*='dark-']), link[rel*='stylesheet' i]:not([disabled])";
export const COLOR_KEYWORDS = new Set([
    "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige", "bisque", "black",
    "blanchedalmond", "blue", "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse",
    "chocolate", "coral", "cornflowerblue", "cornsilk", "crimson", "cyan", "darkblue", "darkcyan",
    "darkgoldenrod", "darkgray", "darkgreen", "darkgrey", "darkkhaki", "darkmagenta", "darkolivegreen",
    "darkorange", "darkorchid", "darkred", "darksalmon", "darkseagreen", "darkslateblue", "darkslategray",
    "darkslategrey", "darkturquoise", "darkviolet", "deeppink", "deepskyblue", "dimgray", "dimgrey",
    "dodgerblue", "firebrick", "floralwhite", "forestgreen", "fuchsia", "gainsboro", "ghostwhite",
    "gold", "goldenrod", "gray", "green", "greenyellow", "grey", "honeydew", "hotpink", "indianred",
    "indigo", "ivory", "khaki", "lavender", "lavenderblush", "lawngreen", "lemonchiffon", "lightblue",
    "lightcoral", "lightcyan", "lightgoldenrodyellow", "lightgray", "lightgreen", "lightgrey", "lightpink",
    "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray", "lightslategrey", "lightsteelblue",
    "lightyellow", "lime", "limegreen", "linen", "magenta", "maroon", "mediumaquamarine", "mediumblue",
    "mediumorchid", "mediumpurple", "mediumseagreen", "mediumslateblue", "mediumspringgreen",
    "mediumturquoise", "mediumvioletred", "midnightblue", "mintcream", "mistyrose", "moccasin",
    "navajowhite", "navy", "oldlace", "olive", "olivedrab", "orange", "orangered", "orchid", "palegoldenrod",
    "palegreen", "paleturquoise", "palevioletred", "papayawhip", "peachpuff", "peru", "pink", "plum",
    "powderblue", "purple", "rebeccapurple", "red", "rosybrown", "royalblue", "saddlebrown", "salmon",
    "sandybrown", "seagreen", "seashell", "sienna", "silver", "skyblue", "slateblue", "slategray",
    "slategrey", "snow", "springgreen", "steelblue", "tan", "teal", "thistle", "tomato", "turquoise",
    "violet", "wheat", "white", "whitesmoke", "yellow", "yellowgreen",

    // 特殊功能色
    "transparent", "currentColor", "inherit", "initial", "unset"
]);
export const EARLY_STYLE = ".dark-bili:root{--Ga0:#1f2224;--Ga0_s:#1f2224;--Ga0_t:#1f2224;--Ga1:#242729;--Ga1_s:#242729;--Ga1_t:#242729;--Ga1_e:#242729;--Ga2:#303437;--Ga2_t:#303437;--Ga3:#2f3236;--Ga3_t:#2f3236;--Ga4:#464b51;--Ga4_t:#464b51;--Ga5:#5f646b;--Ga5_t:#5f646b;--Ga6:#787e86;--Ga6_t:#787e86;--Ga7:#92979e;--Ga7_t:#92979e;--Ga8:#acb0b7;--Ga8_t:#acb0b7;--Ga9:#c7cad0;--Ga9_t:#c7cad0;--Ga10:#e3e4e7;--Ga10_t:#e3e4e7;--Ga11:#181a1b;--Ga12:#242729;--Ga12_s:#1f2224;--Ga13:#242729;--Ga13_s:#242729;--Wh0:#181a1b;--Wh0_s:#181a1b;--Wh0_t:#181a1b;--Ba0:#ffffff;--Ba0_s:#ffffff;--Ba0_t:#ffffff;--Pi0:#241a1e;--Pi1:#2b1a20;--Pi2:#3e1a26;--Pi3:#4c0017;--Pi4:#730024;--Pi5:#990033;--Pi5_t:#990033;--Pi6:#b41751;--Pi7:#ce2f6f;--Pi8:#e35291;--Pi9:#ee88b8;--Pi10:#f8c0dc;--Ma0:#241b25;--Ma1:#2c1c2c;--Ma2:#401e3c;--Ma3:#510845;--Ma4:#790d69;--Ma5:#a2118f;--Ma6:#be25af;--Ma7:#da3acf;--Ma8:#e864e4;--Ma9:#f098f0;--Ma10:#f6cbf7;--Re0:#251c1c;--Re1:#2d1d1c;--Re2:#431f1d;--Re3:#550803;--Re4:#800b05;--Re5:#ab0d07;--Re6:#c21d1d;--Re7:#d8363b;--Re8:#e66069;--Re9:#f18e98;--Re10:#f9c4cb;--Or0:#29221b;--Or1:#34271b;--Or2:#50341b;--Or3:#703200;--Or4:#a74800;--Or5:#db5b00;--Or6:#fc6e16;--Or7:#ff8544;--Or8:#ff9f72;--Or9:#ffbca1;--Or10:#ffdcd0;--Ye0:#28251b;--Ye1:#332c1b;--Ye2:#4e3f1b;--Ye3:#6c4800;--Ye4:#a26900;--Ye5:#d88900;--Ye6:#ff9b05;--Ye7:#ffab3d;--Ye8:#ffbf75;--Ye9:#ffd2a4;--Ye10:#ffe6d0;--Ly0:#2b2a1b;--Ly1:#38351b;--Ly2:#403600;--Ly3:#7f6a00;--Ly4:#bf9c00;--Ly5:#ffcc00;--Ly6:#ffcd2a;--Ly7:#ffd255;--Ly8:#ffd97f;--Ly9:#ffe3aa;--Ly10:#ffefd4;--Lg0:#242a1f;--Lg1:#2c3521;--Lg2:#28370d;--Lg3:#4f6e19;--Lg4:#74a426;--Lg5:#97db33;--Lg6:#affa4e;--Lg7:#bbfb71;--Lg8:#c9fc95;--Lg9:#d8fdb8;--Lg10:#ebfedc;--Gr0:#1c2a23;--Gr1:#1f3528;--Gr2:#0e351a;--Gr3:#1b6a35;--Gr4:#29a053;--Gr5:#37d571;--Gr6:#4cf18e;--Gr7:#6ff7aa;--Gr8:#91fbc2;--Gr9:#b6fcd9;--Gr10:#dbfeee;--Cy0:#1c2c2d;--Cy1:#1f3738;--Cy2:#0f3a3b;--Cy3:#1e7676;--Cy4:#2cb0ae;--Cy5:#3bebe6;--Cy6:#55fdfd;--Cy7:#77fafe;--Cy8:#99f7fe;--Cy9:#bbf7fe;--Cy10:#ddfaff;--Lb0:#19292e;--Lb1:#1a333b;--Lb2:#053340;--Lb3:#09637f;--Lb4:#0e93bf;--Lb5:#13c1ff;--Lb6:#3ac4ff;--Lb7:#62cbff;--Lb8:#89d4ff;--Lb9:#b0dfff;--Lb10:#d8eeff;--Bl0:#181c27;--Bl1:#181e2f;--Bl2:#182243;--Bl3:#00114f;--Bl4:#001c77;--Bl5:#00279e;--Bl6:#1b3cb3;--Bl7:#3752c8;--Bl8:#5368de;--Bl9:#808ded;--Bl10:#bec3f7;--Pu0:#1d1a26;--Pu1:#211a2d;--Pu2:#2a1a3f;--Pu3:#220049;--Pu4:#31006d;--Pu5:#3f0092;--Pu6:#541ba9;--Pu7:#6733c1;--Pu8:#7b4cd8;--Pu9:#9d7ce9;--Pu10:#cabbf5;--Br0:#212120;--Br1:#272523;--Br2:#37312b;--Br3:#3e2d1f;--Br4:#5c432f;--Br5:#7b573e;--Br6:#95715a;--Br7:#ac8c7a;--Br8:#c1a89c;--Br9:#d6c4bd;--Br10:#eae1de;--Si0:#1b1f21;--Si1:#1d2125;--Si2:#23292f;--Si3:#2d3843;--Si4:#202d3c;--Si5:#2a3b50;--Si6:#465872;--Si7:#637592;--Si8:#8393b2;--Si9:#abb6cd;--Si10:#d4d9e6;}.dark-bili>body *{opacity: 0;}";
export const BASIC_STYLE = `
.desktop-download-tip, .palette-button-outer, .floor-single-card, .ad-report, .bg, .bgc{
    display: none;
}

.dark-bili body{
    background: rgb(24, 26, 27);
}
`;
export const IGNORE_SELECTOR = [".pswp"];
export const SHORT_HAND_PROP = ["background", "border"];
