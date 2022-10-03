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

// INTERFACE ---INTERFACE---INTERFACE---INTERFACE---INTERFACE---INTERFACE---INTERFACE---INTERFACE---INTERFACE------------------------------------

const degToRad = (d) => (d * Math.PI) / 180;

const radToDeg = (r) => (r * 180) / Math.PI;

var config = {
  rotate: degToRad(20),
  x: 1,
  y: 0,
  addFrente: function () {
    countF++;

    mioca.children.push({
      name: `mioca${countF}`,
      translation: [countF - 1, 0, 0],
    });
    objectsToDraw = [];
    objects = [];
    nodeInfosByName = {};
    scene = makeNode(mioca);

    console.log(mioca);
    return;
  },
  addCima: function () {
    countC++;

    mioca.children.push({
      name: `miocaCima${countC}`,
      translation: [0, countC, 0],
    });
    objectsToDraw = [];
    objects = [];
    nodeInfosByName = {};
    scene = makeNode(mioca);

    console.log(mioca);
    return;
  },
};

const loadGUI = (gl) => {
  const gui = new dat.GUI();
  gui.add(config, "rotate", 0, 20, 0.1);
  gui.add(config, "x", 1, 1000, 1);
  gui.add(config, "y", -50, gl.canvas.height, 1);
  gui.add(config, "addFrente");
  gui.add(config, "addCima");

  //gui.add(config, "teste", 0, 100);
};

// INTERFACE ---INTERFACE---INTERFACE---INTERFACE---INTERFACE---INTERFACE---INTERFACE---INTERFACE---INTERFACE------------------------------------

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

// VARIAVEIS PARA USO NO MAIN ----------------------------------------------------------------------------------

var objectsToDraw = [];
var objects = [];
var nodeInfosByName = {};
var scene;
var mioca = {};
var countF = 0;
var countC = 0;
var programInfo;
var cubeBufferInfo;
var cubeVAO;

// VARIAVEIS PARA USO NO MAIN ----------------------------------------------------------------------------------

function makeNode(nodeDescription) {
  var trs = new TRS();
  var node = new Node(trs);
  nodeInfosByName[nodeDescription.name] = {
    trs: trs,
    node: node,
  };
  trs.translation = nodeDescription.translation || trs.translation;
  //trs.scale = trs.scale;
  if (nodeDescription.draw !== false) {
    node.drawInfo = {
      uniforms: {
        u_colorOffset: [0, 0, 0.5, 0],
        u_colorMult: [0.4, 0.4, 0.4, 1],
      },
      programInfo: programInfo,
      // Alterar buffer info para a forma desejada
      bufferInfo: cubeBufferInfo,
      // Alterar vertexArray para a informação desejada
      vertexArray: cubeVAO,
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
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  loadGUI(gl);

  // Tell the twgl to match position with a_position, n
  // normal with a_normal etc..
  twgl.setAttributePrefix("a_");

  cubeBufferInfo = flattenedPrimitives.createCubeBufferInfo(gl, 1);

  // setup GLSL program
  programInfo = twgl.createProgramInfo(gl, [vs, fs]);

  cubeVAO = twgl.createVAOFromBufferInfo(gl, programInfo, cubeBufferInfo);

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  var fieldOfViewRadians = degToRad(60);

  // Let's make all the nodes

  mioca = {
    name: "mioca1",
    translation: [0, 0, 0],
    children: [
      {
        name: "mioca2",
        translation: [1, 0, 0],
      },
    ],
  };
  countF = 2;

  //   var scene = makeNode(blockGuyNodeDescriptions);
  //   nodeInfosByName["left-finger"].trs.scale = [0.5, 2, 0.5];
  //   nodeInfosByName["handle"].trs.scale = [0.2, 1.5, 0.3];
  //   nodeInfosByName["handle"].trs.translation = [-1, -0.8, 0];
  //   nodeInfosByName["hilt"].trs.scale = [2, 0.2, 0.5];
  //   nodeInfosByName["hilt"].trs.translation = [-1, 0, 0];
  //   nodeInfosByName["blade"].trs.scale = [0.5, 3.5, 0.1];
  //   nodeInfosByName["blade"].trs.translation = [-1, 1.8, 0];
  scene = makeNode(mioca);
  requestAnimationFrame(drawScene);
  console.log(objects);
  // Draw the scene.
  function drawScene(time) {
    time *= 0.001;

    twgl.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 200);

    // Compute the camera's matrix using look at.
    var cameraPosition = [4, 3.5, 10];
    var target = [0, 3.5, 0];
    var up = [0, 1, 0];
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    var adjust;
    var speed = 3;
    var c = time * speed;
    adjust = degToRad(time * config.x);
    nodeInfosByName["mioca1"].trs.rotation[0] = adjust;

    // adjust = Math.abs(Math.sin(c));
    // nodeInfosByName["point between feet"].trs.translation[1] = adjust;

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
