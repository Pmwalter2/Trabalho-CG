"use strict";

var vs = `#version 300 es
in vec4 a_position;
in vec4 a_color;
uniform mat4 u_matrix;
out vec4 v_color;
void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;
  // Pass the color to the fragment shader.
  //v_color = a_color;
  v_color = a_position;
}
`;

var fs = `#version 300 es
precision highp float;
// Passed in from the vertex shader.
in vec4 v_color;
uniform vec4 u_colorMult;
uniform vec4 u_colorOffset;
out vec4 outColor;
void main() {
   outColor = v_color * u_colorMult + u_colorOffset;
}
`;

var vsw = `
attribute vec4 a_position;
attribute vec3 a_barycentric;
uniform mat4 u_matrix;
varying vec3 vbc;
void main() {
  vbc = a_barycentric;
  gl_Position = u_matrix * a_position;
}`;

var fsw = `
precision mediump float;
varying vec3 vbc;
void main() {
  if(vbc.x < 0.03 || vbc.y < 0.03 || vbc.z < 0.03) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  } 
  else {
    gl_FragColor = vec4(vbc.x, vbc.y, vbc.z, 1.0);
  }
}`;
const calculateBarycentric = (length) => {
  const n = length / 9;
  const barycentric = [];
  for (let i = 0; i < n; i++) barycentric.push(1, 0, 0, 0, 1, 0, 0, 0, 1);
  return new Float32Array(barycentric);
};

const degToRad = (d) => (d * Math.PI) / 180;

const radToDeg = (r) => (r * 180) / Math.PI;

const calculaMeioDoTriangulo = (arr) => {
  const x = (arr[0] + arr[3] + arr[6]) / 3;
  const y = (arr[1] + arr[4] + arr[7]) / 3;
  const z = (arr[2] + arr[5] + arr[8]) / 3;

  return [x, y, z];
};

const crossProduct = (a, b) => {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
};

const somaNormal = (v, n) => {
  return [v[0] + n[0], v[1] + n[1], v[2] + n[2]];
};

const calculaMeioDoTrianguloIndices = (arr) => {
  // arr contem os indices dos vertices q formam o triangulo que quero adicionar um vertice no meio
  const x =
    (arrays_pyramid.position[arr[0] * 3] +
      arrays_pyramid.position[arr[1] * 3] +
      arrays_pyramid.position[arr[2] * 3]) /
    3;
  const y =
    (arrays_pyramid.position[arr[0] * 3 + 1] +
      arrays_pyramid.position[arr[1] * 3 + 1] +
      arrays_pyramid.position[arr[2] * 3 + 1]) /
    3;
  const z =
    (arrays_pyramid.position[arr[0] * 3 + 2] +
      arrays_pyramid.position[arr[1] * 3 + 2] +
      arrays_pyramid.position[arr[2] * 3 + 2]) /
    3;

  return [x, y, z];
};

var teste = 1;
var gui;
var qtd_triangulos = 0;
var config = {
  rotate: 0,
  x: 0,
  y: 0,
  z: 0,
  spin_x: 0,
  spin_y: 0,
  camera_x: 4,
  camera_y: 3.5,
  camera_z: 10,

  addCaixa: function () {
    countC++;

    objeto.children.push({
      name: `cubo${countC}`,
      translation: [0, countC, 0],
    });

    objectsToDraw = [];
    objects = [];
    nodeInfosByName = {};
    scene = makeNode(objeto);
  },
  triangulo: 0,

  criarVertice: function () {
    console.log("indices");
    console.log(arrays_pyramid.indices);
    var n = config.triangulo * 3;
    var inicio = arrays_pyramid.indices.slice(0, n);
    var temp = arrays_pyramid.indices.slice(n, n + 3);
    var resto = arrays_pyramid.indices.slice(
      n + 3,
      arrays_pyramid.indices.length
    );
    var b = calculaMeioDoTrianguloIndices(temp);
    var new_indice = arrays_pyramid.position.length / 3;

    arrays_pyramid.position = new Float32Array([
      ...arrays_pyramid.position,
      ...b,
    ]);
    console.log("b");
    console.log(arrays_pyramid.position);
    var novotri = [
      temp[0],
      new_indice,
      temp[1],

      temp[1],
      new_indice,
      temp[2],

      temp[2],
      new_indice,
      temp[0],
    ];
    console.log("novotri");
    console.log(novotri);
    var final = new Uint16Array([...inicio, ...novotri, ...resto]);

    arrays_pyramid.indices = new Uint16Array([...final]);
    console.log("indices");
    console.log(arrays_pyramid.indices);

    console.log("positions");
    console.log(arrays_pyramid.position);

    // console.log(arrays_pyramid.position);
    // console.log(arrays_pyramid.indices);
    cubeBufferInfo = twgl.createBufferInfoFromArrays(gl, arrays_pyramid);

    objectsToDraw = [];
    objects = [];
    nodeInfosByName = {};
    scene = makeNode(objeto);

    gui.updateDisplay();
    //drawScene();
  },
  //time: 0.0,
  target: 3.5,
  vx: 0,
  vy: 0,
  vz: 0,
  vertice: 0,
  moverVertice: function () {
    var n = config.vertice * 3;
    arrays_pyramid.position[n] = config.vx;
    arrays_pyramid.position[n + 1] = config.vy;
    arrays_pyramid.position[n + 2] = config.vz;
    cubeBufferInfo = twgl.createBufferInfoFromArrays(gl, arrays_pyramid);

    objectsToDraw = [];
    objects = [];
    nodeInfosByName = {};
    scene = makeNode(objeto);
  },
  camera_1: false,
  camera_2: false,
  camera_3: false,
};

const moveVertice = function () {
  var n = config.vertice * 3;
  arrays_pyramid.position[n] = config.vx;
  arrays_pyramid.position[n + 1] = config.vy;
  arrays_pyramid.position[n + 2] = config.vz;
  cubeBufferInfo = twgl.createBufferInfoFromArrays(gl, arrays_pyramid);

  objectsToDraw = [];
  objects = [];
  nodeInfosByName = {};
  scene = makeNode(objeto);
};

var folder_vertice;
var folder_camera;
var folder_matrix;

const loadGUI = () => {
  gui = new dat.GUI();
  folder_vertice = gui.addFolder("Manipular vertices");
  folder_camera = gui.addFolder("Manipular cameras");
  folder_matrix = gui.addFolder("Manipular matrizes");
  folder_vertice.open();
  folder_matrix
    .add(config, "rotate", 0, 360, 0.5)
    .listen()
    .onChange(function () {
      nodeInfosByName["cubo0"].trs.rotation[0] = degToRad(config.rotate);
      // A ANIMACAO DE GIRAR SOBREPOE ESSA ALTERACAO TODA VEZ Q RENDERIZA
      // TEM Q USAR OU UM OU OUTRO
    });
  folder_matrix.add(config, "x", -10, 10, 0.5);
  folder_matrix.add(config, "y", -10, 10, 0.5);
  folder_matrix.add(config, "z", -10, 10, 0.5);

  folder_matrix.add(config, "spin_x", -1000, 1000, 2);
  folder_matrix.add(config, "spin_y", -1000, 1000, 2);

  gui.add(config, "addCaixa");
  folder_camera.add(config, "camera_x", -200, 200, 1);
  folder_camera.add(config, "camera_y", -200, 200, 1);
  folder_camera.add(config, "camera_z", -200, 200, 1);

  folder_vertice.add(config, "triangulo", 0, 20, 1);
  folder_vertice.add(config, "criarVertice");
  // gui
  //   .add(config, "time", 0, teste)
  //   .listen()
  //   .onChange(function () {
  //     //config.rotate = config.time + 1;

  //     gui.updateDisplay();
  //   });
  folder_camera.add(config, "target", -5, 5, 0.01);
  folder_vertice.add(config, "vertice").onChange(function () {
    const temp = arrays_pyramid.position.slice(
      config.vertice * 3,
      config.vertice * 3 + 3
    );

    config.vx = temp[0];
    config.vy = temp[1];
    config.vz = temp[2];

    gui.updateDisplay();
  });
  folder_vertice.add(config, "vx", -10, 10, 0.1).onChange(function () {
    moveVertice();
  });
  folder_vertice.add(config, "vy", -10, 10, 0.1).onChange(function () {
    moveVertice();
  });
  folder_vertice.add(config, "vz", -10, 10, 0.1).onChange(function () {
    moveVertice();
  });
  folder_camera
    .add(config, "camera_1")
    .listen()
    .onChange(function () {
      config.camera_2 = false;
      config.camera_3 = false;
    });
  folder_camera
    .add(config, "camera_2")
    .listen()
    .onChange(function () {
      config.camera_1 = false;
      config.camera_3 = false;
    });
  folder_camera
    .add(config, "camera_3")
    .listen()
    .onChange(function () {
      config.camera_1 = false;
      config.camera_2 = false;
    });
  //folder_vertice.add(config, "moverVertice");
};

var TRS = function () {
  this.translation = [0, 0, 0];
  this.rotation = [0, 0, 0];
  this.scale = [1, 1, 1];
};

TRS.prototype.getMatrix = function (dst) {
  dst = dst || new Float32Array(16);
  var t = this.translation;
  var r = this.rotation;
  var s = this.scale;

  // compute a matrix from translation, rotation, and scale
  m4.translation(t[0], t[1], t[2], dst);
  m4.xRotate(dst, r[0], dst);
  m4.yRotate(dst, r[1], dst);
  m4.zRotate(dst, r[2], dst);
  m4.scale(dst, s[0], s[1], s[2], dst);
  return dst;
};

var Node = function (source) {
  this.children = [];
  this.localMatrix = m4.identity();
  this.worldMatrix = m4.identity();
  this.source = source;
};

Node.prototype.setParent = function (parent) {
  // remove us from our parent
  if (this.parent) {
    var ndx = this.parent.children.indexOf(this);
    if (ndx >= 0) {
      this.parent.children.splice(ndx, 1);
    }
  }

  // Add us to our new parent
  if (parent) {
    parent.children.push(this);
  }
  this.parent = parent;
};

Node.prototype.updateWorldMatrix = function (matrix) {
  var source = this.source;
  if (source) {
    source.getMatrix(this.localMatrix);
  }

  if (matrix) {
    // a matrix was passed in so do the math
    m4.multiply(matrix, this.localMatrix, this.worldMatrix);
  } else {
    // no matrix was passed in so just copy.
    m4.copy(this.localMatrix, this.worldMatrix);
  }

  // now process all the children
  var worldMatrix = this.worldMatrix;
  this.children.forEach(function (child) {
    child.updateWorldMatrix(worldMatrix);
  });
};

var VAO;
var cubeBufferInfo;
var objectsToDraw = [];
var objects = [];
var nodeInfosByName = {};
var scene;
var objeto = {};
var countF = 0;
var countC = 0;
var programInfo;
var wireframe = false;
var arrays_pyramid;
var gl;
var aspect;
var projectionMatrix;
var cameraMatrix;
var viewMatrix;
var viewProjectionMatrix;
var adjust;
var speed;
var c;
var fieldOfViewRadians;

//CAMERA VARIABLES
var cameraPosition;
var target;
var up;

function makeNode(nodeDescription) {
  var trs = new TRS();
  var node = new Node(trs);
  nodeInfosByName[nodeDescription.name] = {
    trs: trs,
    node: node,
  };
  trs.translation = nodeDescription.translation || trs.translation;
  if (nodeDescription.draw !== false) {
    if (wireframe) {
      node.drawInfo = {
        uniforms: {
          u_matrix: [0, 0, 0, 1],
        },
        programInfo: programInfo,
        bufferInfo: cubeBufferInfo,
        vertexArray: VAO,
      };
    } else {
      node.drawInfo = {
        uniforms: {
          u_colorOffset: [0.2, 0.2, 0.7, 0],
          u_colorMult: [0.4, 0.1, 0.4, 1],
        },
        programInfo: programInfo,
        bufferInfo: cubeBufferInfo,
        vertexArray: VAO,
      };
    }
    objectsToDraw.push(node.drawInfo);
    objects.push(node);

    makeNodes(nodeDescription.children).forEach(function (child) {
      child.setParent(node);
    });
    return node;
  }
}

function makeNodes(nodeDescriptions) {
  return nodeDescriptions ? nodeDescriptions.map(makeNode) : [];
}
function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  loadGUI(gl);

  // Tell the twgl to match position with a_position, n
  // normal with a_normal etc..
  twgl.setAttributePrefix("a_");
  var indices = new Uint16Array([
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14,
    15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
  ]);
  //cubeBufferInfo = flattenedPrimitives.createCubeBufferInfo(gl, 1);
  arrays_pyramid = {
    // position: new Float32Array([
    //   0, 1, 0,

    //   -1, -1, 1,

    //   1, -1, 1,

    //   0, 1, 0,

    //   1, -1, 1,

    //   1, -1, -1,

    //   0, 1, 0,

    //   1, -1, -1,

    //   -1, -1, -1,

    //   0, 1, 0,

    //   -1, -1, -1,

    //   -1, -1, 1,

    //   -1, -1, -1,

    //   1, -1, 1,

    //   -1, -1, 1,

    //   -1, -1, -1,

    //   1, -1, -1,

    //   1, -1, 1,
    // ]),

    position: new Float32Array([
      0, 1, 0,

      -1, -1, 1,

      1, -1, 1,

      1, -1, -1,

      -1, -1, -1,
    ]),

    // texcoord: new Float32Array([
    //   1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1,
    //   1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1,
    //   0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1, 0, 1, 1,
    //   1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0,
    //   0, 1, 1,
    // ]),

    // vetor de indices nao eh usado com o wireframe pq o wireframe precisa que cada triangulo
    // que seja declarado no vetor precisa ser unico
    indices: new Uint16Array([
      //0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 8, 4, 1, 8, 5, 2,
      0, 1, 2,

      0, 3, 2,

      0, 4, 3,

      0, 4, 1,

      4, 1, 2,

      3, 4, 2,
    ]),
    normal: new Float32Array([
      1, -1, 1,

      1, -1, 1,

      1, 1, 1,

      -1, 1, 1,

      -1, -1, -1,

      //-1, 1, -1,
    ]),
    barycentric: [],
  };
  arrays_pyramid.barycentric = calculateBarycentric(
    arrays_pyramid.position.length
  );
  for (
    let index = 0;
    index < arrays_pyramid.indices.length;
    index = index + 3
  ) {
    // cross(B-A, C-A)
    var a = arrays_pyramid.position[arrays_pyramid.indices[index]];
    var b = arrays_pyramid.position[arrays_pyramid.indices[index + 1]];
    var c = arrays_pyramid.position[arrays_pyramid.indices[index + 2]];
    var x = crossProduct(
      [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
      [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    );

    arrays_pyramid.normal[arrays_pyramid.indices[index]] = somaNormal(
      arrays_pyramid.normal[arrays_pyramid.indices[index]],
      x
    );
    arrays_pyramid.normal[arrays_pyramid.indices[index + 1]] = somaNormal(
      arrays_pyramid.normal[arrays_pyramid.indices[index + 1]],
      x
    );
    arrays_pyramid.normal[arrays_pyramid.indices[index + 2]] = somaNormal(
      arrays_pyramid.normal[arrays_pyramid.indices[index + 2]],
      x
    );
  }

  // As posicoes do arrays_cube tao erradas, sem o CULL_FACES e sem os indices ta ruim
  var arrays_cube = {
    // vertex positions for a cube
    position: [
      1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1,
      -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1,
      1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1,
      1, -1, 1, -1, -1, -1, -1, -1,
    ],
    // vertex normals for a cube
    normal: [
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
      -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
      0, 0, -1,
    ],
    indices: [
      0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12,
      14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
    ],
    // barycentric: [
    //   0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12,
    //   14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
    // ],
  };
  cubeBufferInfo = twgl.createBufferInfoFromArrays(gl, arrays_pyramid);

  console.log(calculaMeioDoTrianguloIndices([0, 3, 2]));
  console.log(arrays_pyramid.position[0 * 3 + 1]);
  console.log("a");
  // Dado um array como:
  //   var arrays = {
  //     position: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0],
  //     texcoord: [0, 0, 0, 1, 1, 0, 1, 1],
  //     normal:   [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  //     indices:  [0, 1, 2, 1, 2, 3],
  //  };

  // Cria um buffer como esse
  // bufferInfo = {
  //   numElements: 4,        // or whatever the number of elements is
  //   indices: WebGLBuffer,  // this property will not exist if there are no indices
  //   attribs: {
  //     position: { buffer: WebGLBuffer, numComponents: 3, },
  //     normal:   { buffer: WebGLBuffer, numComponents: 3, },
  //     texcoord: { buffer: WebGLBuffer, numComponents: 2, },
  //   },
  // };
  console.log(cubeBufferInfo);
  console.log(arrays_cube.indices.length);

  // setup GLSL program

  programInfo = twgl.createProgramInfo(gl, [vs, fs]);

  VAO = twgl.createVAOFromBufferInfo(gl, programInfo, cubeBufferInfo);

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  fieldOfViewRadians = degToRad(60);

  objectsToDraw = [];
  objects = [];
  nodeInfosByName = {};

  // Let's make all the nodes
  objeto = {
    name: "cubo0",
    translation: [0, 0, 0],
    children: [],
  };
  console.log(programInfo);
  scene = makeNode(objeto);
  cameraPosition = [config.camera_x, config.camera_y, config.camera_z];
  requestAnimationFrame(drawScene);

  // Draw the scene.
}
function drawScene(time) {
  time *= 0.001;
  teste = time;
  config.time = config.time;
  twgl.resizeCanvasToDisplaySize(gl.canvas);

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  //gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  // Compute the projection matrix
  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 200);

  // Compute the camera's matrix using look at.
  //cameraPosition = [config.camera_x, config.camera_y, config.camera_z];
  if (!config.camera_1 && !config.camera_2 && !config.camera_3) {
    if (cameraPosition[0] > config.camera_x) cameraPosition[0] -= 1;
    if (cameraPosition[0] < config.camera_x) cameraPosition[0] += 1;

    if (cameraPosition[1] > config.camera_y) cameraPosition[1] -= 1;
    if (cameraPosition[1] < config.camera_y) cameraPosition[1] += 1;

    if (cameraPosition[2] > config.camera_z) cameraPosition[2] -= 1;
    if (cameraPosition[2] < config.camera_z) cameraPosition[2] += 1;
  } else if (config.camera_1) {
    if (cameraPosition[0] > 4) cameraPosition[0] -= 0.5;
    if (cameraPosition[0] < 4) cameraPosition[0] += 0.5;

    if (cameraPosition[1] > 4) cameraPosition[1] -= 0.5;
    if (cameraPosition[1] < 4) cameraPosition[1] += 0.5;

    if (cameraPosition[2] > 10) cameraPosition[2] -= 0.5;
    if (cameraPosition[2] < 10) cameraPosition[2] += 0.5;
  } else if (config.camera_2) {
    if (cameraPosition[0] > 10) cameraPosition[0] -= 0.5;
    if (cameraPosition[0] < 10) cameraPosition[0] += 0.5;

    if (cameraPosition[1] > 10) cameraPosition[1] -= 0.5;
    if (cameraPosition[1] < 10) cameraPosition[1] += 0.5;

    if (cameraPosition[2] > 13) cameraPosition[2] -= 0.5;
    if (cameraPosition[2] < 13) cameraPosition[2] += 0.5;
  } else if (config.camera_3) {
    if (cameraPosition[0] > -2) cameraPosition[0] -= 0.5;
    if (cameraPosition[0] < -2) cameraPosition[0] += 0.5;

    if (cameraPosition[1] > -2) cameraPosition[1] -= 0.5;
    if (cameraPosition[1] < -2) cameraPosition[1] += 0.5;

    if (cameraPosition[2] > 5) cameraPosition[2] -= 0.5;
    if (cameraPosition[2] < 5) cameraPosition[2] += 0.5;
  }

  target = [config.target, 0, 0];
  up = [0, 1, 0];
  var cameraMatrix = m4.lookAt(cameraPosition, target, up);

  // Make a view matrix from the camera matrix.
  var viewMatrix = m4.inverse(cameraMatrix);

  var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

  adjust;
  speed = 3;
  c = time * speed;

  adjust = degToRad(time * config.spin_x);
  nodeInfosByName["cubo0"].trs.rotation[0] = adjust;
  adjust = degToRad(time * config.spin_y);
  nodeInfosByName["cubo0"].trs.rotation[1] = adjust;
  nodeInfosByName["cubo0"].trs.translation = [config.x, config.y, config.z];

  //nodeInfosByName["cubo0"].trs.rotation[0] = degToRad(config.rotate);
  // Update all world matrices in the scene graph
  scene.updateWorldMatrix();

  // Compute all the matrices for rendering
  objects.forEach(function (object) {
    object.drawInfo.uniforms.u_matrix = m4.multiply(
      viewProjectionMatrix,
      object.worldMatrix
    );
  });

  // wireframe = false;
  // programInfo = twgl.createProgramInfo(gl, [vs, fs]);

  // VAO = twgl.createVAOFromBufferInfo(gl, programInfo, cubeBufferInfo);

  // objectsToDraw = [];
  // objects = [];
  // nodeInfosByName = {};
  // scene = makeNode(objeto);
  // scene.updateWorldMatrix();
  // objects.forEach(function (object) {
  //   object.drawInfo.uniforms.u_matrix = m4.multiply(
  //     viewProjectionMatrix,
  //     object.worldMatrix
  //   );
  // });
  // //twgl.drawObjectList(gl, objectsToDraw);

  // wireframe = true;
  // programInfo = twgl.createProgramInfo(gl, [vsw, fsw]);

  // VAO = twgl.createVAOFromBufferInfo(gl, programInfo, cubeBufferInfo);

  // //objectsToDraw = [];
  // //objects = [];
  // //nodeInfosByName = {};
  // scene = makeNode(objeto);
  // nodeInfosByName["cubo0"].trs.rotation[0] = adjust;
  // scene.updateWorldMatrix();

  // objects.forEach(function (object) {
  //   object.drawInfo.uniforms.u_matrix = m4.multiply(
  //     viewProjectionMatrix,
  //     object.worldMatrix
  //   );
  // });

  // ------ Draw the objects --------

  twgl.drawObjectList(gl, objectsToDraw);

  requestAnimationFrame(drawScene);
}

main();