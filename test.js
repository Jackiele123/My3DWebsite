import * as THREE from 'three';

import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {ThreeMFLoader} from "three/examples/jsm/loaders/3MFLoader.js";

let camera, scene, renderer;

			init();

			function init() {

				scene = new THREE.Scene();
				scene.background = new THREE.Color( 0xa0a0a0 );
				scene.fog = new THREE.Fog( 0xa0a0a0, 10, 500 );

				camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, 500 );
				camera.position.set( -10, 10, 10 );
				scene.add( camera );
                let count = 1;
				//

				const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d );
				hemiLight.position.set( 0, 100, 0 );
				scene.add( hemiLight );

				const dirLight = new THREE.DirectionalLight( 0xffffff );
				dirLight.position.set( - 0, 40, 50 );
				dirLight.castShadow = true;
				dirLight.shadow.camera.top = 50;
				dirLight.shadow.camera.bottom = - 25;
				dirLight.shadow.camera.left = - 25;
				dirLight.shadow.camera.right = 25;
				dirLight.shadow.camera.near = 0.1;
				dirLight.shadow.camera.far = 200;
				dirLight.shadow.mapSize.set( 1024, 1024 );
				scene.add( dirLight );

				// scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );

				//

				const manager = new THREE.LoadingManager();

				const loader = new ThreeMFLoader( manager );
				loader.load( '/models/test3mf.3MF', function ( object ) {
                    // if (object.name === 'basebearingshaft(Default)Display State 1')
                    //     object.position.set(1000,0,0);
					object.traverse( function ( child ) {
                        count ++;
                        console.log(child);
						child.castShadow = true;
                        if(count%2 == 0)
                            child.position.x = 10;
					} );
                    
					scene.add( object );

				} );

				//

				manager.onLoad = function () {

					render();

				};

				//

				const ground = new THREE.Mesh( new THREE.PlaneGeometry( 1000, 1000 ), new THREE.MeshPhongMaterial( { color: 0xcbcbcb, depthWrite: false } ) );
				ground.rotation.x = - Math.PI / 2;
				ground.position.y = 11;
				ground.receiveShadow = true;
				scene.add( ground );

				//

				renderer = new THREE.WebGLRenderer( { antialias: true } );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				renderer.shadowMap.enabled = true;
				renderer.shadowMap.type = THREE.PCFSoftShadowMap;
				document.body.appendChild( renderer.domElement );

				//

				const controls = new OrbitControls( camera, renderer.domElement );
				controls.addEventListener( 'change', render );
				controls.minDistance = 50;
				controls.maxDistance = 800;
				controls.enablePan = true;
				controls.target.set( 0, 20, 0 );
				controls.update();

				window.addEventListener( 'resize', onWindowResize );

				render();

			}

			function onWindowResize() {

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );

				render();

			}

			function render() {

				renderer.render( scene, camera );

			}