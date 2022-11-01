"use strict";

var vs = `#version 300 es
in vec4 a_position;
in vec4 a_color;
in vec2 a_texcoord;
in uint a_faceId;
uniform mat4 u_matrix;
out vec2 v_texcoord;
flat out uint v_faceId;

void main() {
  
  v_faceId = a_faceId;
  v_texcoord = a_texcoord;
  gl_Position = u_matrix * a_position;
}
`;

var fs = `#version 300 es
precision highp float;
// Passed in from the vertex shader.

in vec2 v_texcoord;
flat in uint v_faceId;
// The texture.


uniform mediump sampler2DArray u_diffuse;
uniform uint u_faceIndex[6];
out vec4 outColor;
void main() {
   
  outColor = texture(u_diffuse, vec3(v_texcoord, u_faceIndex[v_faceId]));
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
    var inicio = arrays_cube_wireframe.position.slice(0, n);
    var temp = arrays_cube_wireframe.position.slice(n, n + 9);
    var resto = arrays_cube_wireframe.position.slice(
      n + 9,
      arrays_cube_wireframe.position.length
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

    arrays_cube_wireframe.position = new Float32Array([...final]);
    arrays_cube_wireframe.barycentric = calculateBarycentric(
      arrays_cube_wireframe.position.length
    );
    cubeBufferInfo = twgl.createBufferInfoFromArrays(gl, arrays_cube_wireframe);

    objectsToDraw = [];
    objects = [];
    nodeInfosByName = {};
    scene = makeNode(objeto);
    //drawScene();
  },
  time: 0.0,

  textura: function(){
    testaTextura = true;
    objectsToDraw.pop();
    scene = makeNode(objeto);
  },
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
var cubeBufferInfoTexture;
var cubeVAOTextura;
var programInfoTextura;
var testaTextura = false;
var textura = false;
var arrays_cube_wireframe;
 
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
    if(testaTextura == true){
      node.drawInfo = {
        uniforms: {
          u_matrix: [0, 0, 0, 1],
        },
        programInfo: programInfoTextura,
        bufferInfo: cubeBufferInfoTexture,
        vertexArray: cubeVAOTextura,
      };
    } else{
      node.drawInfo = {
        uniforms: {
          u_colorOffset: [0, 1, 1, 1],
          u_colorMult: [0.4, 0.1, 0.4, 1],
        },
        programInfo: programInfoTextura,
        bufferInfo: cubeBufferInfoTexture,
        vertexArray: cubeVAOTextura,
      }
    };
    if (wireframe){
      console.log("idfubg")
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

  

  arrays_cube_wireframe = {
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

  arrays_cube_wireframe.barycentric = calculateBarycentric(
    arrays_cube_wireframe.position.length
  );
  cubeBufferInfo = twgl.createBufferInfoFromArrays(gl, arrays_cube_wireframe);

  // setup GLSL program
  programInfo = twgl.createProgramInfo(gl, [vs_wireframe, fs_wireframe]);

  cubeVAO = twgl.createVAOFromBufferInfo(gl, programInfo, cubeBufferInfo);

  var arrays_cube_textura={
    // vertex positions for a cube
    position: new Float32Array([
      1, 1, -1, //0
      1, 1, 1, //1
      1, -1, 1, //2
      1, -1, -1, //3
      -1, 1, 1, //4
      -1, 1, -1, //5
      -1, -1, -1,//6
      -1, -1, 1, //7
      
      -1, 1, 1, //8
      1, 1, 1, //9
      1, 1, -1, //10
      -1, 1, -1, //11
  
      -1, -1, -1,//12
       1, -1, -1,//13
      1, -1, 1, //14
      -1, -1, 1,//15
       1, 1, 1,//16
      -1, 1, 1,//17
      -1, -1, 1,//18
      1, -1, 1, //19
      -1, 1, -1, //20
      1, 1, -1, //21
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
    texcoord: [1,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1],
    faceId:   { numComponents: 1, data: new Uint8Array([0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6]), },
    indices: new Uint16Array([
      0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12,
      14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
    ]),
  };

  cubeBufferInfoTexture = twgl.createBufferInfoFromArrays(gl, arrays_cube_textura);

  // setup GLSL program
  programInfoTextura = twgl.createProgramInfo(gl, [vs, fs]);

  cubeVAOTextura = twgl.createVAOFromBufferInfo(gl, programInfoTextura, cubeBufferInfoTexture);

  var imagem =["noodles.jpg"]
  
      var tex = twgl.createTexture(gl, {
      target: gl.TEXTURE_2D_ARRAY,
      src: imagem,
      });
    
      var uniforms = {
      u_diffuse: tex,
      u_faceIndex: [0, 1, 2, 3, 4, 5],
    };




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
  console.log(objectsToDraw)
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
    if(testaTextura == true){
      gl.useProgram(programInfoTextura.program);
      twgl.setBuffersAndAttributes(gl, programInfoTextura, cubeBufferInfoTexture);
      twgl.setUniforms(programInfoTextura, uniforms);
      twgl.drawBufferInfo(gl, cubeBufferInfoTexture);
    }
    twgl.drawObjectList(gl, objectsToDraw);
    requestAnimationFrame(drawScene);
  }
  
}

main();