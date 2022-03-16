const int2HexColor = (num) => `#${num.toString(16).padStart(6, '0')}`;
const rgb2Int = (r, g, b) => r * 256 * 256 + g * 256 + b;
let name = 0;
class ColorTracker {
  constructor() {
    this.name = name++;
    this.index = 0;
    this.max = 255 * 255 * 255 - 1;
    this.registry = {};
  }

  register(obj) {
    this.index += 5;
    const total = this.index;
    const color = int2HexColor(total);
    this.registry[total] = obj;
    if (this.index >= this.max) {
      this.index = 0;
    }
    return color;
  }

  lookup(color) {
    return this.registry[rgb2Int(...color)];
  }
  clear() {
    this.index = 0;
    this.registry = {};
  }
}
export default ColorTracker;
