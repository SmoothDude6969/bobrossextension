(function() {
    try {
        console.log("Miniblox Rainbow Sphere Extension: Initializing at " + new Date().toISOString());

        // Delay execution to avoid WebGL conflicts with Miniblox
        setTimeout(() => {
            console.log("Starting scene setup");

            // Create container for the scene
            const container = document.createElement('div');
            container.id = 'rainbow-container';
            document.body.appendChild(container);
            console.log("Container created: #rainbow-container");

            // Inject Google Fonts for pixelated text
            const fontLink = document.createElement('link');
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
            fontLink.rel = 'stylesheet';
            fontLink.onload = () => console.log("Font loaded successfully");
            fontLink.onerror = () => console.error("Failed to load Google Fonts");
            document.head.appendChild(fontLink);

            // Inject styles
            const style = document.createElement('style');
            style.textContent = `
                #rainbow-container { 
                    margin: 0; 
                    background: black; 
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 2147483640;
                }
                #rainbow-canvas { 
                    display: block; 
                    position: absolute;
                    top: 0;
                    left: 0;
                    z-index: 2147483641;
                }
                #rainbow-title {
                    position: absolute;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    color: white;
                    font-family: 'Press Start 2P', cursive;
                    font-size: 1.5em;
                    text-align: center;
                    z-index: 2147483642;
                    text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
                    cursor: pointer;
                    animation: wobble 2s ease-in-out infinite;
                    transition: transform 0.3s ease;
                }
                #rainbow-title:hover {
                    transform: translateX(-50%) scale(1.2);
                }
                @keyframes wobble {
                    0% { transform: translateX(-50%) rotate(0deg); }
                    25% { transform: translateX(-50%) rotate(2deg); }
                    75% { transform: translateX(-50%) rotate(-2deg); }
                    100% { transform: translateX(-50%) rotate(0deg); }
                }
                .hidden {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
            console.log("Styles injected");

            // Inject title text
            const title = document.createElement('div');
            title.id = 'rainbow-title';
            title.textContent = 'Rainbow Client';
            container.appendChild(title);
            console.log("Title created: #rainbow-title");

            // Inject Three.js script
            const threeScript = document.createElement('script');
            threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';
            threeScript.onload = function() {
                console.log("Three.js loaded successfully");
                try {
                    // Scene setup
                    console.log("Setting up Three.js scene");
                    const scene = new THREE.Scene();
                    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                    const renderer = new THREE.WebGLRenderer({ antialias: false });
                    renderer.setSize(window.innerWidth, window.innerHeight);
                    renderer.setPixelRatio(1);
                    renderer.domElement.id = 'rainbow-canvas';
                    container.appendChild(renderer.domElement);
                    console.log("Renderer created and canvas appended");

                    // Check WebGL availability
                    if (!renderer.getContext()) {
                        console.error("WebGL is not supported or failed to initialize");
                        container.innerHTML += '<p style="color: white; text-align: center;">WebGL is not supported in your browser.</p>';
                        return;
                    }
                    console.log("WebGL context available");

                    // Create sphere geometry
                    const geometry = new THREE.SphereGeometry(1, 32, 32);
                    console.log("Sphere geometry created");

                    // Custom shader for pixelated rainbow glow effect
                    const vertexShader = `
                        varying vec3 vNormal;
                        varying vec3 vPosition;
                        void main() {
                            vNormal = normalize(normalMatrix * normal);
                            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `;

                    const fragmentShader = `
                        varying vec3 vNormal;
                        varying vec3 vPosition;
                        uniform float time;
                        uniform float glowIntensity;
                        void main() {
                            vec3 color = vec3(
                                sin(vPosition.x + time) * 0.5 + 0.5,
                                sin(vPosition.y + time + 2.0) * 0.5 + 0.5,
                                sin(vPosition.z + time + 4.0) * 0.5 + 0.5
                            );
                            float pixelSize = 0.1;
                            color = floor(color / pixelSize) * pixelSize;
                            float intensity = pow(0.6 - dot(vNormal, normalize(-vPosition)), 2.0) * glowIntensity;
                            gl_FragColor = vec4(color * intensity, 1.0);
                        }
                    `;

                    try {
                        const material = new THREE.ShaderMaterial({
                            vertexShader: vertexShader,
                            fragmentShader: fragmentShader,
                            uniforms: {
                                time: { value: 0.0 },
                                glowIntensity: { value: 1.5 }
                            },
                            transparent: true,
                            side: THREE.FrontSide
                        });
                        console.log("Shader material created");
                        const sphere = new THREE.Mesh(geometry, material);
                        scene.add(sphere);
                        console.log("Sphere added to scene");
                    } catch (e) {
                        console.error("Shader creation failed: ", e);
                        const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
                        const sphere = new THREE.Mesh(geometry, fallbackMaterial);
                        scene.add(sphere);
                        console.log("Fallback sphere (magenta) added to scene");
                    }

                    // Add point light for additional glow
                    const pointLight = new THREE.PointLight(0xffffff, 1.5, 5);
                    pointLight.position.set(0, 0, 0);
                    scene.add(pointLight);
                    console.log("Point light added");

                    // Camera position
                    camera.position.z = 3;
                    console.log("Camera positioned");

                    // Animation loop
                    function animate(t = 0) {
                        requestAnimationFrame(animate);
                        sphere.rotation.y += 0.01;
                        if (material.uniforms) {
                            material.uniforms.time.value = t * 0.001;
                        }
                        renderer.render(scene, camera);
                    }
                    animate();
                    console.log("Animation loop started");

                    // Handle window resize
                    window.addEventListener('resize', () => {
                        camera.aspect = window.innerWidth / window.innerHeight;
                        camera.updateProjectionMatrix();
                        renderer.setSize(window.innerWidth, window.innerHeight);
                        console.log("Window resized");
                    });

                    // Click event to hide everything
                    title.addEventListener('click', () => {
                        console.log("Title clicked, hiding container");
                        container.classList.add('hidden');
                    });
                    console.log("Click event listener added");
                } catch (e) {
                    console.error("Error setting up Three.js scene: ", e);
                    container.innerHTML += '<p style="color: white; text-align: center;">Failed to set up 3D scene.</p>';
                }
            };
            threeScript.onerror = () => console.error("Failed to load Three.js");
            document.head.appendChild(threeScript);
            console.log("Three.js script injected");
        }, 1000); // 1-second delay to avoid Miniblox WebGL conflicts
    } catch (e) {
        console.error("Miniblox Rainbow Sphere Extension: Initialization failed: ", e);
    }
})();
