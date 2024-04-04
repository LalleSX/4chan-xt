import { E } from '../globals/globals';
import { svgPathData as imgSvg, width as imgW, height as imgH } from "@fa/faImage";
import { svgPathData as eyeSvg, width as eyeW, height as eyeH } from "@fa/faEye";
import { svgPathData as expandSvg, width as expandW, height as expandH } from "@fas/faUpRightAndDownLeftFromCenter";
import { svgPathData as commentSvg, width as commentW, height as commentH } from "@fa/faComment";
import { svgPathData as refreshSvg, width as refreshW, height as refreshH } from "@fas/faRotate";
import { svgPathData as wrenchSvg, width as wrenchW, height as wrenchH } from "@fas/faWrench";
import { svgPathData as boltSvg, width as boltW, height as boltH } from "@fas/faBolt";
import { svgPathData as pencilSvg, width as pencilW, height as pencilH } from "@fas/faPencil";
import { svgPathData as clipboardSvg, width as clipboardW, height as clipboardH } from "@fas/faClipboard";
import { svgPathData as clockSvg, width as clockW, height as clockH } from "@fa/faClock";
import { svgPathData as linkSvg, width as linkW, height as linkH } from "@fas/faLink";
import { svgPathData as shuffleSvg, width as shuffleW, height as shuffleH } from "@fas/faShuffle";
import { svgPathData as undoSvg, width as undoW, height as undoH } from "@fas/faRotateLeft";


const toSvg = (svgPathData: string, width: string | number, height: string | number) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 ${width} ${height}">` +
    `<path d="${svgPathData}" fill="currentColor" /></svg>`;
}

const icons = {
   image:     toSvg(imgSvg, imgW, imgH),
   eye:       toSvg(eyeSvg, eyeW, eyeH),
   expand:    toSvg(expandSvg, expandW, expandH),
   comment:   toSvg(commentSvg, commentW, commentH),
   refresh:   toSvg(refreshSvg, refreshW, refreshH),
   wrench:    toSvg(wrenchSvg, wrenchW, wrenchH),
   bolt:      toSvg(boltSvg, boltW, boltH),
   link:      toSvg(linkSvg, linkW, linkH),
   pencil:    toSvg(pencilSvg, pencilW, pencilH),
   clipboard: toSvg(clipboardSvg, clipboardW, clipboardH),
   clock:     toSvg(clockSvg, clockW, clockH),
   shuffle:   toSvg(shuffleSvg, shuffleW, shuffleH),
   undo:      toSvg(undoSvg, undoW, undoH),
} as const;

var Icon = {
  set (node: HTMLElement, name: keyof typeof icons, altText?: string) {
    const html = icons[name];
    if (!html) throw new Error(`Icon "${name}" not found.`);
    if (altText) {
     node.innerHTML = `<span class="icon--alt-text">${E(altText)}</span>${html}`;
    } else {
      node.innerHTML = html;
    }
  }
};

export default Icon;
