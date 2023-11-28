import WindowManager from './WindowManager.js';

const t = THREE;
let camera, scene, renderer, world;
let near, far;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
let images = []; // Array to store image textures
let sceneOffsetTarget = { x: 0, y: 0 };
let sceneOffset = { x: 0, y: 0 };
let today = new Date();
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);
today.setMilliseconds(0);
today = today.getTime();

let internalTime = getTime();
let windowManager;
let initialized = false;
let imageLoaded = false;

// get time in seconds since beginning of the day (so that all windows use the same time)
function getTime ()
{
	return (new Date().getTime() - today) / 1000.0;
}


if (new URLSearchParams(window.location.search).get("clear"))
{
	localStorage.clear();
}
else
{	
	// this code is essential to circumvent that some browsers preload the content of some pages before you actually hit the url
	document.addEventListener("visibilitychange", () => 
	{
		if (document.visibilityState != 'hidden' && !initialized)
		{
			init();
		}
	});

	window.onload = () => {
		if (document.visibilityState != 'hidden')
		{
			init();
		}
	};

	function init ()
	{
		initialized = true;

		// add a short timeout because window.offsetX reports wrong values before a short period 
		setTimeout(() => {
			setupScene();
			setupWindowManager();
			resize();
			updateWindowShape(false);
			render();
			window.addEventListener('resize', resize);
		}, 500)	
	}

	function setupScene ()
	{
		camera = new t.OrthographicCamera(0, 0, window.innerWidth, window.innerHeight, -10000, 10000);
		
		camera.position.z = 2.5;
		near = camera.position.z - .5;
		far = camera.position.z + 0.5;

		scene = new t.Scene();
		scene.background = new t.Color(0.0);
		scene.add( camera );

		renderer = new t.WebGLRenderer({antialias: true, depthBuffer: true});
		renderer.setPixelRatio(pixR);
	    
	  	world = new t.Object3D();
		scene.add(world);

		renderer.domElement.setAttribute("id", "scene");
		document.body.appendChild( renderer.domElement );
	}

	function setupWindowManager ()
	{
		windowManager = new WindowManager();
		windowManager.setWinShapeChangeCallback(updateWindowShape);
		windowManager.setWinChangeCallback(windowsUpdated);

		// here you can add your custom metadata to each windows instance
		let metaData = {foo: "bar"};

		// this will init the windowmanager and add this window to the centralised pool of windows
		windowManager.init(metaData);

		// call update windows initially (it will later be called by the win change callback)
		windowsUpdated();
	}

	function windowsUpdated ()
	{
		updateNumberOfImages();
	}

	function updateNumberOfImages() {
		let wins = windowManager.getWindows();
	
		// Remove all previous images
		images.forEach((image) => {
			world.remove(image);
		});
	
		images = [];
	
		// Add new images based on the current window setup
		for (let i = 0; i < wins.length; i++) {
			let win = wins[i];
	
			// Load image texture
			let texture = i == 0 ?
				new t.TextureLoader().load(`./img/Mumu.png`, onLoadCallback) :
				new t.TextureLoader().load(`./img/MumuClone.png`, onLoadCallback);
			
			if(!imageLoaded) return;
			texture.flipY = false;
	
			let scale = 0.2;
			let geometry = new t.PlaneGeometry(~~(514 * scale), ~~(718 * scale));

			// Use MeshBasicMaterial with transparent set to true
			let material = new t.MeshBasicMaterial({ map: texture, side: t.DoubleSide, transparent: true });
	
			let image = new t.Mesh(geometry, material);
			image.position.x = win.shape.x + win.shape.w * 0.5;
			image.position.y = win.shape.y + win.shape.h * 0.5;
	
			world.add(image);
			images.push(image);
		}
	}

	function onLoadCallback(){
		if(imageLoaded) return;
		imageLoaded = true;
		console.log("Image Loaded");
		updateNumberOfImages();
	}

	function updateWindowShape (easing = true)
	{
		// storing the actual offset in a proxy that we update against in the render function
		sceneOffsetTarget = {x: -window.screenX, y: -window.screenY};
		if (!easing) sceneOffset = sceneOffsetTarget;
	}


	function render() {
		let t = getTime();
	
		windowManager.update();
	
		let falloff = 0.05;
		sceneOffset.x = sceneOffset.x + (sceneOffsetTarget.x - sceneOffset.x) * falloff;
		sceneOffset.y = sceneOffset.y + (sceneOffsetTarget.y - sceneOffset.y) * falloff;
	
		world.position.x = sceneOffset.x;
		world.position.y = sceneOffset.y;
	
		let wins = windowManager.getWindows();
	
		for (let i = 0; i < images.length; i++) {
			let image = images[i];
			let win = wins[i];
			let _t = t;
	
			let posTarget = { x: win.shape.x + win.shape.w * 0.5, y: win.shape.y + win.shape.h * 0.5 };
	
			image.position.x = image.position.x + (posTarget.x - image.position.x) * falloff;
			image.position.y = image.position.y + (posTarget.y - image.position.y) * falloff;
		}
	
		renderer.render(scene, camera);
		requestAnimationFrame(render);
	}


	// resize the renderer to fit the window size
	function resize ()
	{
		let width = window.innerWidth;
		let height = window.innerHeight
		
		camera = new t.OrthographicCamera(0, width, 0, height, -10000, 10000);
		camera.updateProjectionMatrix();
		renderer.setSize( width, height );
	}
}
