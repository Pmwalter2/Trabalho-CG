var config = {
  rotate: degToRad(20),
  x: 0,
  y: 0,
  color: function () {
    var color = [Math.random(), Math.random(), Math.random(), 1];
    //cubeUniforms.u_colorMult = [Math.random(), Math.random(), Math.random(), 1];
    return color;
  },
};

const loadGUI = (gl) => {
  const gui = new dat.GUI();
  gui.add(config, "rotate", 0, 20, 0.1);
  gui.add(config, "x", -50, 50, 1);
  gui.add(config, "y", -50, gl.canvas.height, 1);
  gui.add(config, "color");
  //gui.add(config, "teste", 0, 100);
};
