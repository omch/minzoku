var camera, scene, renderer, controls;
var minzoku;
var omega=0.1, grab=false, lastX, lastY, newX, newY, originX, originY;
init();
update();

function init() {
    grab=false;
    lastX = lastY = newX = newY = originX = originY =0;

    scene = new THREE.Scene();

    // camera
    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 2000 );
    camera.position.set( 0, 0, 4 );
    camera.lookAt( 0, 0, 0 );
    controls = new THREE.OrbitControls( camera );

    // minzoku
    var modelLoader = new THREE.JSONLoader();
    modelLoader.load( 'model.json', ( geometry, materials ) => {
        minzoku = new THREE.Mesh( geometry, materials );
        minzoku.position.set( 0, 0, 0 );
        var s = 0.3;
        minzoku.scale.set( s, s, s );
        minzoku.rotation.x = 80;
        scene.add( minzoku );
    } );

    // lights
    var ambientLight = new THREE.AmbientLight( 0xeeeeee );
    scene.add( ambientLight );
    var dLight = new THREE.DirectionalLight( 0xffffff, 1);
    dLight.position.set( 2, 1.6, 0.6 );
    scene.add( dLight );

    // renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x14aa86, 1 );
    document.body.appendChild( renderer.domElement );

    // events
    window.addEventListener( 'resize', onWindowResize, false );

    // mouse events
    renderer.domElement.addEventListener( 'mousedown', (e) => {
        if ( e.button != 0 ) return;
        grab = true;
        originX = lastX = newX = e.pageX;
        originY = lastY = nreY = e.pageY;
    }, false );
    renderer.domElement.addEventListener( 'mouseup', (e) => {
        if ( e.button != 0 ) return;
        grab = false;
        vel = Math.sqrt((lastX-newX)*(lastX-newX)+(lastY-newY)*(lastY-newY)) / 100;
        omega = vel;
    }, false );
    renderer.domElement.addEventListener( 'mousemove', (e )=> {
        lastX = newX;
        lastY = newY;
        newX = e.pageX;
        newY = e.pageY;
        if ( grab ) minzoku.rotation.y = ( originX - newX ) / 20;
    }, false );

}
function onWindowResize() {
    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}
function update() {
    requestAnimationFrame( update );
    controls.update();
    if ( !grab ) minzoku.rotation.y += omega;
    renderer.render( scene, camera );
}
