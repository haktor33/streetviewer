import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

export const addLabel = (mesh, text, position) => {
    const div = document.createElement('div');
    div.className = 'text-label';
    div.textContent = text;
    div.style.marginTop = '-1em';
    const label = new CSS2DObject(div);
    if (position) {
        label.position.set(position.x, position.y, position.z);
    } else {
        label.position.set(0, 1, 0);
    }
    mesh.add(label);
}
