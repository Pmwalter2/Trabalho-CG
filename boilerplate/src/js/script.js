const cubeUniforms = {
  u_colorMult: [0.8, 0, 0.8, 1],
  //u_colorMult: [Math.random(), 0, 0.2, 1],
  u_matrix: m4.identity(),
};
function newColor() {
  cubeUniforms.u_colorMult = config.color();
}
function main() {
  const { gl, meshProgramInfo } = initializeWorld();


  const cubeBufferInfo = flattenedPrimitives.createCubeBufferInfo(gl, 20);

  const cubeVAO = twgl.createVAOFromBufferInfo(
    gl,
    meshProgramInfo,
    cubeBufferInfo
  );

  var fieldOfViewRadians = degToRad(30);

  function computeMatrix(viewProjectionMatrix, translation, yRotation) {
    var matrix = m4.translate(
      viewProjectionMatrix,
      translation[0],
      translation[1],
      translation[2]
    );
    return m4.yRotate(matrix, yRotation);
  }

  loadGUI(gl);

  function render() {
    twgl.resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    // Compute the camera's matrix using look at.
    var cameraPosition = [0, 0, 100];
    var target = [0, 0, 0];
    var up = [0, 1, 0];
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    gl.useProgram(meshProgramInfo.program);

    // ------ Draw the cube --------

    // Setup all the needed attributes.
    gl.bindVertexArray(cubeVAO);

    cubeUniforms.u_matrix = computeMatrix(
      viewProjectionMatrix,
      [config.x, config.y, 0],
      config.rotate
    );
    //cubeUniforms.u_colorMult = config.color();
    // cubeUniforms.u_colorMult = [
    //   converter(config.rotate, 20),
    //   0.2,
    //   converter(config.rotate, 20),
    //   1,
    // ];
    // Set the uniforms we just computed
    twgl.setUniforms(meshProgramInfo, cubeUniforms);

    twgl.drawBufferInfo(gl, cubeBufferInfo);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
function converter(n, range) {
  //n = n % 20;
  // n = 1.0 / n;
  var OldRange = range;
  var NewRange = 1.0;
  return (n * NewRange) / OldRange;
}

main();
