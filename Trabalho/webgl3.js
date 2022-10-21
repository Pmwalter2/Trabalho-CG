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
  v_color = a_color;
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

var vs_wireframe = `
attribute vec4 a_position;
attribute vec3 a_barycentric;
uniform mat4 u_matrix;
varying vec3 vbc;

void main() {
  vbc = a_barycentric;
  gl_Position = u_matrix * a_position;
}`;

var fs_wireframe = `
precision mediump float;
varying vec3 vbc;

void main() {
  if(vbc.x < 0.03 || vbc.y < 0.03 || vbc.z < 0.03) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  } 
  else {
    gl_FragColor = vec4(0.5, 0.9, 0.8, 0.0);
  }
}`;

const calculateBarycentric = (length) => {
  const n = length / 6;
  const barycentric = [];
  for (let i = 0; i < n; i++) barycentric.push(1, 0, 0, 0, 1, 0, 0, 0, 1);
  return new Float32Array(barycentric);
};

const calculaMeioDoTriangulo = (arr) => {
  const x = (arr[0] + arr[3] + arr[6]) / 3;
  const y = (arr[1] + arr[4] + arr[7]) / 3;
  const z = (arr[2] + arr[5] + arr[8]) / 3;

  return [x, y, z];
};

const degToRad = (d) => (d * Math.PI) / 180;

const radToDeg = (r) => (r * 180) / Math.PI;

var config = {
  rotate: degToRad(20),
  x: 0,
  y: 0,
  rotation: 0,
  camera_x: 4,
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
  AdicionarVertice: function () {
    var n = config.triangulo * 9;
    var inicio = arrays_cube.position.slice(0, n);
    var temp = arrays_cube.position.slice(n, n + 9);
    var resto = arrays_cube.position.slice(
      n + 9,
      arrays_cube.position.length
    );
    var b = calculaMeioDoTriangulo(temp);
    var novotri = [
      temp[0],
      temp[1],
      temp[2],
      b[0],
      b[1],
      b[2],

      temp[3],
      temp[4],
      temp[5],

      temp[3],
      temp[4],
      temp[5],
      b[0],
      b[1],
      b[2],
      temp[6],
      temp[7],
      temp[8],

      temp[6],
      temp[7],
      temp[8],
      b[0],
      b[1],
      b[2],
      temp[0],
      temp[1],
      temp[2],
    ];
    var final = new Float32Array([...inicio, ...novotri, ...resto]);

    arrays_cube.position = new Float32Array([...final]);
    arrays_cube.barycentric = calculateBarycentric(
      arrays_cube.position.length
    );
    cubeBufferInfo = twgl.createBufferInfoFromArrays(gl, arrays_cube);

    objectsToDraw = [];
    objects = [];
    nodeInfosByName = {};
    scene = makeNode(objeto);
    qtd_triangulos = arrays_cube.position.length / 9;
    console.log(qtd_triangulos);
    gui.updateDisplay();
    //drawScene();
  },
  time: 0.0,

  textura: function(){},
  objetos:function(){}
};

const loadGUI = () => {
  const gui = new dat.GUI();
  gui.add(config, "rotate", 0, 20, 0.5);
  gui.add(config, "x", -150, 150, 5);
  gui.add(config, "y", -100, 100, 5);
  gui.add(config, "rotation", -1000, 1000, 10);
  gui.add(config, "addCaixa");
  gui.add(config, "camera_x", 0, 20, 0.5);
  gui.add(config, "triangulo", 0, 20, 0.5);
  gui.add(config, "AdicionarVertice");
  gui.add(config, "time", 0, 100);
  var textura = gui.addFolder("Textura");
  textura.add(config,'textura').name('Mudar textura');
  var objetos = gui.addFolder("Editor de cena");
  objetos.add(config, 'objetos').name('Adicionar objetos');
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
var gl;
var cubeVAO;
var cubeBufferInfo;
var objectsToDraw = [];
var objects = [];
var nodeInfosByName = {};
var scene;
var objeto = {};
var countF = 0;
var countC = 0;
var programInfo;
var wireframe = true
var arrays_cube;
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
    if (wireframe){
      node.drawInfo = {
        uniforms: {
          u_matrix: [0, 0, 0, 1],
        },
        programInfo: programInfo,
        bufferInfo: cubeBufferInfo,
        vertexArray: cubeVAO,
      };
    } else{
      node.drawInfo = {
        uniforms: {
          u_colorOffset: [0, 1, 1, 1],
          u_colorMult: [0.4, 0.1, 0.4, 1],
        },
        programInfo: programInfo,
        bufferInfo: cubeBufferInfo,
        vertexArray: cubeVAO,
      }
    };
    objectsToDraw.push(node.drawInfo);
    objects.push(node);
  }
  makeNodes(nodeDescription.children).forEach(function (child) {
    child.setParent(node);
  });
  return node;
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
  //cubeBufferInfo = flattenedPrimitives.createCubeBufferInfo(gl, 1);

  

  arrays_cube = {
    // vertex positions for a cube
    position: new Float32Array([
      1, 1, -1, //0
       
      1, 1, 1,//1

      1, -1, 1,//2

      1, 1, -1,//0

      1, -1, 1,//2

      1, -1, -1,//3 //Direito

      -1, 1, 1,//4

      -1, 1, -1, //5

      -1, -1, -1,//6 

      -1, 1, 1,//4 

      -1, -1, -1,//6 

      -1, -1, 1, //7 // Esquerdo

      -1, 1, 1,//8

      1, 1, 1, //9

      1, 1, -1, //10

      -1, 1, 1,//8

      1, 1, -1, //10

      -1, 1, -1, //11 //Cima
      
      -1, -1, -1,//12

      1, -1, -1,//13

      1, -1, 1,//14

      -1, -1, -1,//12

      1, -1, 1,//14

      -1, -1, 1,//15

      1, 1, 1, //16

      -1, 1, 1, //17

      -1, -1, 1, //18

      1, 1, 1, //16

      -1, -1, 1, //18

      1, -1, 1, //19

      -1, 1, -1,//20

      1, 1, -1,//21

      1, -1, -1,//22

      -1, 1, -1,//20

      1, -1, -1,//22
       
      -1, -1, -1,//23
    ]),
    // vertex normals for a cube
    normal: new Float32Array([
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
      -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
      0, 0, -1,
    ]),
   
    
    barycentric: [],
  };
  console.log(arrays_cube.position.length)
  arrays_cube.barycentric = calculateBarycentric(
    arrays_cube.position.length
  );
  cubeBufferInfo = twgl.createBufferInfoFromArrays(gl, arrays_cube);

  // setup GLSL program
  programInfo = twgl.createProgramInfo(gl, [vs_wireframe, fs_wireframe]);

  cubeVAO = twgl.createVAOFromBufferInfo(gl, programInfo, cubeBufferInfo);

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  var fieldOfViewRadians = degToRad(60);

  objectsToDraw = [];
  objects = [];
  nodeInfosByName = {};

  // Let's make all the nodes
  objeto = {
    name: "cubo0",
    translation: [0, 0, 0],
    children: [],
  };
// -------------------------- TEXTURA --------------------------
  // Create a texture.
  var texture = gl.createTexture();

  // use texture unit 0
  gl.activeTexture(gl.TEXTURE0 + 0);

  // bind to the TEXTURE_2D bind point of texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Fill the texture with a 1x1 blue pixel.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

   // Asynchronously load an image
   var image = new Image();
   image.src = "dado.jpg";
   image.addEventListener('load', function() {
     // Now that the image has loaded make copy it to the texture.
     gl.bindTexture(gl.TEXTURE_2D, texture);
     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
     gl.generateMipmap(gl.TEXTURE_2D);
   });

  scene = makeNode(objeto);

  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(time) {
    time *= 0.001;
    config.time = time;
    

    twgl.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    //gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 200);

    // Compute the camera's matrix using look at.
    cameraPosition = [config.camera_x, 3.5, 10];
    target = [0, 3.5, 0];
    up = [0, 1, 0];
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    var adjust;
    var speed = 3;
    var c = time * speed;

    adjust = degToRad(time * config.rotation);
    nodeInfosByName["cubo0"].trs.rotation[0] = adjust;
    // Update all world matrices in the scene graph
    scene.updateWorldMatrix();

    // Compute all the matrices for rendering
    objects.forEach(function (object) {
      object.drawInfo.uniforms.u_matrix = m4.multiply(
        viewProjectionMatrix,
        object.worldMatrix
      );
    });

    // ------ Draw the objects --------

    twgl.drawObjectList(gl, objectsToDraw);
    
    requestAnimationFrame(drawScene);
  }
}

main();