var camera, scene, renderer, controls;
var minzoku;
var handle, omega = 0, boost, smoothness;
setBoost(50);
setSmoothness(50);

var Handle = function( pageX, pageY ) {
    this.originP = new THREE.Vector2( pageX, pageY );
    this.newP = this.originP.clone();
    this.lastP = this.originP.clone();
    this.initialPhase = 0;
    this.initialPhase = minzoku.rotation.y - this.getPhase();
}

Handle.prototype = {
    update: function( pageX, pageY ) {
        this.lastP.copy(this.newP);
        this.newP.set( pageX, pageY );
    },

    getPhase: function() {
        var p = this._normalize( this.newP );
        return this._getAngle( p.x, p.y ) + this.initialPhase;
    },

    getOmega: function() {
        var n = this._normalize( this.newP ),
            l = this._normalize( this.lastP );
        var vel = boost * n.clone().sub(l).length();
        if ( n.x * l.y - n.y * l.x > 0 ) {
            return -vel;
        } else {
            return vel;
        }
    },

    // pageX, pageY を [-1, 1]^2 に正規化
    _normalize: function( pageP ) {
        var size = renderer.getSize();
        return new THREE.Vector2(
            2 * pageP.x / size.width - 1,
            -2 * pageP.y / size.height + 1
        );
    },

    _getAngle: function( x, y ) {
        var v = this._inverseProjection( x, y );
        return Math.atan2( v.y, v.x );
    },

    // 正規化座標からxy平面への逆射影。
    _inverseProjection: function( x, y ) {
        var vp = camera.projectionMatrix.clone().multiply( camera.matrixWorldInverse.clone() );
        var v = new THREE.Vector3( x, y, 0.8 );
        var w = new THREE.Vector3( x, y, 0 );
        v.applyMatrix4( (new THREE.Matrix4()).getInverse( vp.clone() ) );
        w = camera.position;
        var r = -w.z / (v.z - w.z);
        return w.clone().add( v.sub( w ).multiplyScalar( r ) );
    }
}

function init() {
    var container = document.getElementById("container");
    scene = new THREE.Scene();

    // camera
    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 2000 );
    camera.position.set( 1, 1.2, 3.6 );
    camera.lookAt( 0, 0, 0 );
    controls = new THREE.OrbitControls( camera, container );

    // minzoku
    var modelLoader = new THREE.JSONLoader();
    modelLoader.load( 'model.json', ( geometry, materials ) => {
        materials[0].shading=THREE.FlatShading;
        minzoku = new THREE.Mesh( geometry, materials );
        minzoku.position.set( 0, 0, 0 );
        const s = 0.3;
        minzoku.scale.set( s, s, s );
        minzoku.rotation.x = Math.PI / 2;
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
    container.appendChild( renderer.domElement );

    // events
    window.addEventListener( 'resize', onWindowResize, false );

    // mouse events
    renderer.domElement.addEventListener( 'mousedown', OnMouseDown, false);
    renderer.domElement.addEventListener( 'mouseup', OnMouseUp, false);
    renderer.domElement.addEventListener( 'mousemove', OnMouseMove, false);
    renderer.domElement.addEventListener( 'touchstart', OnTouchStart, {passive: false});
    renderer.domElement.addEventListener( 'touchend', OnTouchEnd, {passive: false});
    renderer.domElement.addEventListener( 'touchmove', OnTouchMove, {passive: false});
}

function HandleStart( x, y ) {
    handle = new Handle( x, y );
}
function HandleEnd() {
    if ( !handle ) return;
    omega = handle.getOmega();
    handle = null;
}
function HandleUpdate( x, y ) {
    if ( !handle ) return;
    handle.update( x, y );
    minzoku.rotation.y = handle.getPhase();
}
function OnMouseDown(e) {
    if ( e.button != 0 ) return;
    HandleStart( e.pageX, e.pageY );
}
function OnMouseUp(e) {
    if ( e.button != 0 ) return;
    HandleEnd();
}
function OnMouseMove(e) {
    HandleUpdate( e.pageX, e.pageY );
}
function OnTouchStart(e) {
    if ( e.touches.length != 1 ) return;
    HandleStart( e.touches[0].pageX, e.touches[0].pageY );
}
function OnTouchEnd(e) {
    if ( e.touches.length != 0 ) return;
    HandleEnd();
}
function OnTouchMove(e) {
    e.preventDefault();
    if ( e.touches.length != 1) return;
    HandleUpdate( e.touches[0].pageX, e.touches[0].pageY );
}

function onWindowResize() {
    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

function setBoost(val) {
    boost =  0.5 + val  * 0.03;
}

function setSmoothness(val) {
    if ( val == 0 ) { smoothness = 0; }
    else if ( val == 100 ) { smoothness = 1; }
    else {
         // 正実数全体を動く 1 - (1/x) を適当なスケールで近似 (パラメータと回転時間が比例する)
        smoothness = 1 - 0.4 /  (val * 7 - 6);
    }
}

function toggleConsole() {
    var cl = document.getElementById( "console" ).classList;
    var mark = "console-open";
    if ( cl.contains( mark ) ) {
        cl.remove( mark );
    } else {
        cl.add( mark );
    }
}

function update() {
    requestAnimationFrame( update );
    controls.update();
    omega *= smoothness;
    if ( minzoku && !handle ) minzoku.rotation.y += omega;
    renderer.render( scene, camera );
}


init();
update();
