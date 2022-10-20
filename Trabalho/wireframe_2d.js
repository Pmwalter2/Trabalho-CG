"use strict";

var vertexShaderSource = `#version 300 es
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;
// A matrix to transform the positions by
uniform mat3 u_matrix;
// all shaders have a main function
void main() {
  // Multiply the position by the matrix.
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
}
`;

var fragmentShaderSource = `#version 300 es
precision highp float;
uniform vec4 u_color;
// we need to declare an output for the fragment shader
out vec4 outColor;
void main() {
  outColor = u_color;
}
`;

const vertex = `
attribute vec2 a_position;
attribute vec3 a_barycentric;
uniform mat3 u_matrix;
varying vec3 vbc;
void main() {
  vbc = a_barycentric;
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
}`;

const fragment = `
precision mediump float;
varying vec3 vbc;
void main() {
  if(vbc.x < 0.01 || vbc.y < 0.01 || vbc.z < 0.01) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  } else {
    gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
  }
}`;

var size;
var type;
var normalize;
var stride;
var offset;
var vao;
var matrixLocation;
var positionBuffer;
var colorLocation;
var positionAttributeLocation;
var program;
var gl;
var canvas;
var translation;
var rotationInRadians;
var scale;
var color;
var matrix;
var triangleqnt = 0;
var vertexarray = new Float32Array([
    -150, -100,
    150, -100,
    -150,  100,
    150, -100,
    -150,  100,
    150,  100,
]);
var barycentric;
var barycentricLocation;
var barycentricBuffer;

const calculateBarycentric = (length) => {
  const n = length / 2;
  const barycentric = [];
  for (let i = 0; i < n; i++) barycentric.push(1, 0, 0, 0, 1, 0, 0, 0, 1);
  return new Float32Array(barycentric);
};

const degToRad = (d) => (d * Math.PI) / 180;

const radToDeg = (r) => (r * 180) / Math.PI;

const barycentricTriangulo = (arr) => {
  const x = Math.trunc((arr[0] + arr[2] + arr[4]) / 3);
  const y = Math.trunc((arr[1] + arr[3] + arr[5]) / 3);

  return [x, y];
};

var config = {
  rotate: 0.0,
  x: 0,
  y: 0,
  rotation: 1.0,
  triangulo: 1,
  criarVertice: function () {
    var n = config.triangulo * 6;
    console.log("n")
    console.log(n)
    var inicio = vertexarray.slice(0, n);
    console.log("inicio")
    console.log(inicio)
    var temp = vertexarray.slice(n, n + 2);
    console.log("temp")
    console.log(temp)
    var resto = vertexarray.slice(n + 2, vertexarray.length);
    console.log("Resto")
    console.log(resto)
    var b = barycentricTriangulo(temp);
    console.log("b")
    console.log(b)
    var novotri = [
      temp[0],
      temp[1],
      b[0],
      b[1],
      temp[2],
      temp[3],

      temp[2],
      temp[3],
      b[0],
      b[1],
      temp[4],
      temp[5],

      temp[4],
      temp[5],
      b[0],
      b[1],
      temp[0],
      temp[1],
    ];
    var final = new Float32Array([...inicio, ...novotri, ...resto]);

    vertexarray = new Float32Array([...final]);
    console.log(vertexarray);
    drawScene();
    return;
  },
};
console.log(vertexarray);
const loadGUI = () => {
  const gui = new dat.GUI();
  gui.add(config, "rotate", 0, 90, 0.5);
  gui.add(config, "x", 0, gl.canvas.width, 5);
  gui.add(config, "y", 0, gl.canvas.height, 5);
  gui.add(config, "rotation", 0.5, 100, 0.1);

  gui.add(config, "triangulo", 0, 20, 1);
  gui.add(config, "criarVertice");
};

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  console.log(vertexarray);
  canvas = document.querySelector("#canvas");
  gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }
  loadGUI(gl);
  // Use our boilerplate utils to compile the shaders and link into a program
  //   program = webglUtils.createProgramFromSources(gl, [
  //     vertexShaderSource,
  //     fragmentShaderSource,
  //   ]);
  program = webglUtils.createProgramFromSources(gl, [vertex, fragment]);

  // look up where the vertex data needs to go.
  positionAttributeLocation = gl.getAttribLocation(program, "a_position");

  // look up uniform locations
  //colorLocation = gl.getUniformLocation(program, "u_color");
  matrixLocation = gl.getUniformLocation(program, "u_matrix");

  // Create a buffer
  positionBuffer = gl.createBuffer();

  // Create a vertex array object (attribute state)
  vao = gl.createVertexArray();

  // and make it the one we're currently working with
  gl.bindVertexArray(vao);

  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Set Geometry.
  setGeometry(gl);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  size = 2; // 2 components per iteration
  type = gl.FLOAT; // the data is 32bit floats
  normalize = false; // don't normalize the data
  stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    positionAttributeLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );

  // First let's make some variables
  // to hold the translation,
  translation = [150, 100];
  rotationInRadians = 0;
  scale = [1, 1];
  color = [Math.random(), Math.random(), Math.random(), 1];

  barycentric = calculateBarycentric(vertexarray.length);
  barycentricLocation = gl.getAttribLocation(program, "a_barycentric");
  barycentricBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, barycentricBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, barycentric, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(barycentricLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, barycentricBuffer);
  gl.vertexAttribPointer(barycentricLocation, 3, gl.FLOAT, false, 0, 0);

  // Draw the scene.

  requestAnimationFrame(drawScene);
}
function drawScene() {
  const barycentric = calculateBarycentric(vertexarray.length);
  gl.bindBuffer(gl.ARRAY_BUFFER, barycentricBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, barycentric, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionAttributeLocation);
  setGeometry(gl);

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Bind the attribute/buffer set we want.
  gl.bindVertexArray(vao);

  // Set the color.
  gl.uniform4fv(colorLocation, color);

  // Compute the matrix
  matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
  matrix = m3.translate(matrix, config.x, config.y);
  matrix = m3.rotate(matrix, degToRad(config.rotate));
  matrix = m3.scale(matrix, config.rotation, config.rotation);

  // Set the matrix.
  gl.uniformMatrix3fv(matrixLocation, false, matrix);

  // Draw the geometry.
  var primitiveType = gl.TRIANGLES;
  //var primitiveType = gl.LINES;
  var offset = 0;
  var count = vertexarray.length;
  gl.drawArrays(primitiveType, offset, count);
  requestAnimationFrame(drawScene);
}

// Fill the current ARRAY_BUFFER buffer
// with the values that define a letter 'F'.
function setGeometry(gl) {
  gl.bufferData(gl.ARRAY_BUFFER, vertexarray, gl.STATIC_DRAW);
}

var m3 = {
  projection: function projection(width, height) {
    // Note: This matrix flips the Y axis so that 0 is at the top.
    return [2 / width, 0, 0, 0, -2 / height, 0, -1, 1, 1];
  },

  translation: function translation(tx, ty) {
    return [1, 0, 0, 0, 1, 0, tx, ty, 1];
  },

  rotation: function rotation(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [c, -s, 0, s, c, 0, 0, 0, 1];
  },

  scaling: function scaling(sx, sy) {
    return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
  },

  multiply: function multiply(a, b) {
    var a00 = a[0 * 3 + 0];
    var a01 = a[0 * 3 + 1];
    var a02 = a[0 * 3 + 2];
    var a10 = a[1 * 3 + 0];
    var a11 = a[1 * 3 + 1];
    var a12 = a[1 * 3 + 2];
    var a20 = a[2 * 3 + 0];
    var a21 = a[2 * 3 + 1];
    var a22 = a[2 * 3 + 2];
    var b00 = b[0 * 3 + 0];
    var b01 = b[0 * 3 + 1];
    var b02 = b[0 * 3 + 2];
    var b10 = b[1 * 3 + 0];
    var b11 = b[1 * 3 + 1];
    var b12 = b[1 * 3 + 2];
    var b20 = b[2 * 3 + 0];
    var b21 = b[2 * 3 + 1];
    var b22 = b[2 * 3 + 2];
    return [
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ];
  },

  translate: function (m, tx, ty) {
    return m3.multiply(m, m3.translation(tx, ty));
  },

  rotate: function (m, angleInRadians) {
    return m3.multiply(m, m3.rotation(angleInRadians));
  },

  scale: function (m, sx, sy) {
    return m3.multiply(m, m3.scaling(sx, sy));
  },
};

main();