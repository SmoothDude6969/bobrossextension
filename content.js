(function () {
  console.log("Extension loaded");

  // Inject Google Fonts
  const fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
  fontLink.rel = 'stylesheet';
  document.head.appendChild(fontLink);

  // Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    #cube-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1000000;
      pointer-events: none;
    }
    #full-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: black;
      z-index: 999999;
    }
    #miniblox-title {
      position: absolute;
      top: 10%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-family: 'Press Start 2P', cursive;
      font-size: 1.5em;
      text-align: center;
      z-index: 1000002;
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6);
      animation: wobble 2s ease-in-out infinite;
      pointer-events: none;
    }
    #cube-canvas {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1000001;
      cursor: pointer;
      pointer-events: auto;
    }
    @keyframes wobble {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      25% { transform: translate(-50%, -50%) rotate(2deg); }
      75% { transform: translate(-50%, -50%) rotate(-2deg); }
      100% { transform: translate(-50%, -50%) rotate(0deg); }
    }
    .hidden {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  // Inject HTML
  const container = document.createElement('div');
  container.id = 'cube-container';
  container.innerHTML = `
    <div id="full-background"></div>
    <div id="miniblox-title">Miniblox Client</div>
    <canvas id="cube-canvas"></canvas>
  `;
  document.body.appendChild(container);

  // WebGL setup
  const canvas = document.getElementById('cube-canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const gl = canvas.getContext('webgl');

  if (!gl) {
    console.error("WebGL is not supported or failed to initialize.");
    container.innerHTML += 
      '<p style="color: white; text-align: center; z-index: 1000002;">WebGL is not supported in your browser.</p>';
    return;
  }

  // Cube geometry
  const cubeVertices = [
    -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,  0.5,
    -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5, -0.5,  0.5, -0.5, -0.5,
    -0.5,  0.5, -0.5, -0.5,  0.5,  0.5,  0.5,  0.5,  0.5,  0.5,  0.5, -0.5,
    -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,  0.5, -0.5,  0.5, -0.5, -0.5,  0.5,
     0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,
    -0.5, -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5, -0.5,  0.5, -0.5
  ];
  const cubeNormals = [
     0,  0,  1,  0,  0,  1,  0,  0,  1,  0,  0,  1,
     0,  0, -1,  0,  0, -1,  0,  0, -1,  0,  0, -1,
     0,  1,  0,  0,  1,  0,  0,  1,  0,  0,  1,  0,
     0, -1,  0,  0, -1,  0,  0, -1,  0,  0, -1,  0,
     1,  0,  0,  1,  0,  0,  1,  0,  0,  1,  0,  0,
    -1,  0,  0, -1,  0,  0, -1,  0,  0, -1,  0,  0
  ];
  const cubeIndices = [
     0,  1,  2,  0,  2,  3,
     4,  5,  6,  4,  6,  7,
     8,  9, 10,  8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23
  ];

  // Particle geometry (100 particles)
  const particleCount = 100;
  const particlePositions = new Float32Array(particleCount * 3);
  const particleVelocities = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 10;
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    particleVelocities[i * 3] = (Math.random() - 0.5) * 0.1;
    particleVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
    particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
  }

  // Cube vertex shader
  const cubeVertexShaderSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = aNormal;
      vPosition = (uModelViewMatrix * vec4(aPosition, 1.0)).xyz;
      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
    }
  `;

  // Cube fragment shader
  const cubeFragmentShaderSource = `
    precision mediump float;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform vec3 uLightDirection;
    uniform float uTime;
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 lightDir = normalize(uLightDirection);
      float diffuse = max(dot(normal, lightDir), 0.0);
      float ambient = 0.3;
      float specular = pow(max(dot(reflect(-lightDir, normal), normalize(-vPosition)), 0.0), 64.0) * 0.5;
      float emissive = 0.4;
      vec3 color = vec3(1.0, 1.0, 1.0) * (ambient + diffuse + emissive) + vec3(specular);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // Particle vertex shader
  const particleVertexShaderSource = `
    attribute vec3 aPosition;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
      gl_PointSize = 2.0;
    }
  `;

  // Particle fragment shader
  const particleFragmentShaderSource = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `;

  // Bloom fragment shader
  const bloomFragmentShaderSource = `
    precision mediump float;
    uniform sampler2D uTexture;
    uniform vec2 uResolution;
    uniform float uBloomRadius;
    void main() {
      vec2 uv = gl_FragCoord.xy / uResolution;
      vec4 sum = vec4(0.0);
      float scale = uBloomRadius / uResolution.x;
      for (int x = -6; x <= 6; x++) {
        for (int y = -6; y <= 6; y++) {
          vec2 offset = vec2(float(x), float(y)) * scale;
          sum += texture2D(uTexture, uv + offset) * 0.02;
        }
      }
      gl_FragColor = sum;
    }
  `;

  // Compile shaders
  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const cubeVertexShader = createShader(gl, gl.VERTEX_SHADER, cubeVertexShaderSource);
  const cubeFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, cubeFragmentShaderSource);
  const particleVertexShader = createShader(gl, gl.VERTEX_SHADER, particleVertexShaderSource);
  const particleFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, particleFragmentShaderSource);
  const bloomFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, bloomFragmentShaderSource);
  if (!cubeVertexShader || !cubeFragmentShader || !particleVertexShader || !particleFragmentShader || !bloomFragmentShader) return;

  // Create cube program
  const cubeProgram = gl.createProgram();
  gl.attachShader(cubeProgram, cubeVertexShader);
  gl.attachShader(cubeProgram, cubeFragmentShader);
  gl.linkProgram(cubeProgram);
  if (!gl.getProgramParameter(cubeProgram, gl.LINK_STATUS)) {
    console.error('Cube program link error:', gl.getProgramInfoLog(cubeProgram));
    return;
  }

  // Create particle program
  const particleProgram = gl.createProgram();
  gl.attachShader(particleProgram, particleVertexShader);
  gl.attachShader(particleProgram, particleFragmentShader);
  gl.linkProgram(particleProgram);
  if (!gl.getProgramParameter(particleProgram, gl.LINK_STATUS)) {
    console.error('Particle program link error:', gl.getProgramInfoLog(particleProgram));
    return;
  }

  // Create bloom program
  const bloomProgram = gl.createProgram();
  gl.attachShader(bloomProgram, cubeVertexShader);
  gl.attachShader(bloomProgram, bloomFragmentShader);
  gl.linkProgram(bloomProgram);
  if (!gl.getProgramParameter(bloomProgram, gl.LINK_STATUS)) {
    console.error('Bloom program link error:', gl.getProgramInfoLog(bloomProgram));
    return;
  }

  // Cube buffers
  const cubeVertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);

  const cubeNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeNormals), gl.STATIC_DRAW);

  const cubeIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);

  // Particle buffer
  const particleBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, particlePositions, gl.DYNAMIC_DRAW);

  // Framebuffer for bloom
  const renderTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, renderTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, renderTexture, 0);

  // Quad for bloom
  const quadVertices = new Float32Array([
    -1, -1,  0, 0,
     1, -1,  1, 0,
     1,  1,  1, 1,
    -1,  1,  0, 1
  ]);
  const quadIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  const quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
  const quadIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quadIndices, gl.STATIC_DRAW);

  // Attributes and uniforms
  const cubeAPosition = gl.getAttribLocation(cubeProgram, 'aPosition');
  const cubeANormal = gl.getAttribLocation(cubeProgram, 'aNormal');
  const cubeUModelViewMatrix = gl.getUniformLocation(cubeProgram, 'uModelViewMatrix');
  const cubeUProjectionMatrix = gl.getUniformLocation(cubeProgram, 'uProjectionMatrix');
  const cubeULightDirection = gl.getUniformLocation(cubeProgram, 'uLightDirection');
  const cubeUTime = gl.getUniformLocation(cubeProgram, 'uTime');

  const particleAPosition = gl.getAttribLocation(particleProgram, 'aPosition');
  const particleUModelViewMatrix = gl.getUniformLocation(particleProgram, 'uModelViewMatrix');
  const particleUProjectionMatrix = gl.getUniformLocation(particleProgram, 'uProjectionMatrix');

  const bloomAPosition = gl.getAttribLocation(bloomProgram, 'aPosition');
  const uTexture = gl.getUniformLocation(bloomProgram, 'uTexture');
  const uResolution = gl.getUniformLocation(bloomProgram, 'uResolution');
  const uBloomRadius = gl.getUniformLocation(bloomProgram, 'uBloomRadius');

  // Matrix functions
  function createMatrix() {
    const matrix = new Float32Array(16);
    matrix[0] = matrix[5] = matrix[10] = matrix[15] = 1;
    return matrix;
  }

  function perspective(out, fovy, aspect, near, far) {
    const f = 1.0 / Math.tan(fovy / 2);
    const nf = 1 / (near - far);
    out[0] = f / aspect;
    out[5] = f;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[14] = 2 * far * near * nf;
    return out;
  }

  function translate(out, x, y, z) {
    out[12] = x;
    out[13] = y;
    out[14] = z;
    return out;
  }

  function rotateY(out, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    out[0] = c;
    out[2] = -s;
    out[8] = s;
    out[10] = c;
    return out;
  }

  function rotateX(out, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    out[5] = c;
    out[6] = s;
    out[9] = -s;
    out[10] = c;
    return out;
  }

  function multiply(out, a, b) {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
    const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
    const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
    const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];
    out[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
    out[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
    out[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
    out[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
    out[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
    return out;
  }

  // Update particles
  function updateParticles() {
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] += particleVelocities[i * 3];
      particlePositions[i * 3 + 1] += particleVelocities[i * 3 + 1];
      particlePositions[i * 3 + 2] += particleVelocities[i * 3 + 2];
      particleVelocities[i * 3] += (Math.random() - 0.5) * 0.01;
      particleVelocities[i * 3 + 1] += (Math.random() - 0.5) * 0.01;
      particleVelocities[i * 3 + 2] += (Math.random() - 0.5) * 0.01;
      if (Math.abs(particlePositions[i * 3]) > 5) particleVelocities[i * 3] *= -1;
      if (Math.abs(particlePositions[i * 3 + 1]) > 5) particleVelocities[i * 3 + 1] *= -1;
      if (Math.abs(particlePositions[i * 3 + 2]) > 5) particleVelocities[i * 3 + 2] *= -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particlePositions, gl.DYNAMIC_DRAW);
  }

  // Animation loop
  let time = 0;
  let isTransitioning = false;
  function animateCube() {
    if (document.getElementById('cube-container').classList.contains('hidden')) return;
    requestAnimationFrame(animateCube);
    time += 0.01;

    updateParticles();

    let mvMatrix = modelViewMatrix;
    if (isTransitioning) {
      const progress = (Date.now() - transitionStartTime) / 1000;
      if (progress >= 1) {
        completeTransition();
        return;
      }
      const rotation = progress * 2 * Math.PI;
      const zoom = 3 - progress * 2;
      mvMatrix = translate(createMatrix(), 0, 0, -zoom);
      mvMatrix = multiply(mvMatrix, mvMatrix, rotateY(createMatrix(), rotation));
      mvMatrix = multiply(mvMatrix, mvMatrix, rotateX(createMatrix(), rotation * 0.5));
    } else {
      mvMatrix = translate(createMatrix(), 0, 0, -3);
      mvMatrix = multiply(mvMatrix, mvMatrix, rotateY(createMatrix(), time * 0.5));
      mvMatrix = multiply(mvMatrix, mvMatrix, rotateX(createMatrix(), time * 0.5));
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(cubeProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
    gl.enableVertexAttribArray(cubeAPosition);
    gl.vertexAttribPointer(cubeAPosition, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuffer);
    gl.enableVertexAttribArray(cubeANormal);
    gl.vertexAttribPointer(cubeANormal, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
    gl.uniformMatrix4fv(cubeUModelViewMatrix, false, mvMatrix);
    gl.uniformMatrix4fv(cubeUProjectionMatrix, false, projectionMatrix);
    gl.uniform3f(cubeULightDirection, 1.0, 1.0, 1.0);
    gl.uniform1f(cubeUTime, time);
    gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);

    gl.useProgram(particleProgram);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.enableVertexAttribArray(particleAPosition);
    gl.vertexAttribPointer(particleAPosition, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(particleUModelViewMatrix, false, mvMatrix);
    gl.uniformMatrix4fv(particleUProjectionMatrix, false, projectionMatrix);
    gl.drawArrays(gl.POINTS, 0, particleCount);
    gl.disable(gl.BLEND);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(bloomProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.enableVertexAttribArray(bloomAPosition);
    gl.vertexAttribPointer(bloomAPosition, 2, gl.FLOAT, false, 16, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndexBuffer);
    gl.uniform1i(uTexture, 0);
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uBloomRadius, 4.0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, renderTexture);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    gl.useProgram(cubeProgram);
    gl.enable(gl.DEPTH_TEST);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
    gl.enableVertexAttribArray(cubeAPosition);
    gl.vertexAttribPointer(cubeAPosition, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuffer);
    gl.enableVertexAttribArray(cubeANormal);
    gl.vertexAttribPointer(cubeANormal, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
    gl.uniformMatrix4fv(cubeUModelViewMatrix, false, mvMatrix);
    gl.uniformMatrix4fv(cubeUProjectionMatrix, false, projectionMatrix);
    gl.uniform3f(cubeULightDirection, 1.0, 1.0, 1.0);
    gl.uniform1f(cubeUTime, time);
    gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);

    gl.useProgram(particleProgram);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.enableVertexAttribArray(particleAPosition);
    gl.vertexAttribPointer(particleAPosition, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(particleUModelViewMatrix, false, mvMatrix);
    gl.uniformMatrix4fv(particleUProjectionMatrix, false, projectionMatrix);
    gl.drawArrays(gl.POINTS, 0, particleCount);
    gl.disable(gl.BLEND);
  }
  animateCube();

  // Transition animation
  let transitionStartTime;
  function startTransition() {
    if (isTransitioning) return;
    isTransitioning = true;
    transitionStartTime = Date.now();
    console.log("Starting whirl transition");
  }

  function completeTransition() {
    const container = document.getElementById('cube-container');
    container.classList.add('hidden');
    isTransitioning = false;
    console.log("Transition completed");
  }

  // Handle window resize
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    perspective(projectionMatrix, 75 * Math.PI / 180, window.innerWidth / window.innerHeight, 0.1, 1000);
    gl.bindTexture(gl.TEXTURE_2D, renderTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  });

  // Click event for cube
  document.getElementById('cube-canvas').addEventListener('click', startTransition);

  const projectionMatrix = perspective(createMatrix(), 75 * Math.PI / 180, window.innerWidth / window.innerHeight, 0.1, 1000);
  const modelViewMatrix = translate(createMatrix(), 0, 0, -3);
})();
