var camera, scene, renderer, controls;
var minzoku;
var handle, omega = 0;

var Handle = function( pageX, pageY ) {
    this.originX = this.lastX = this.newX = pageX;
    this.originY = this.lastY = this.newY = pageY;
    this.initialPhase = 0;
    this.initialPhase = minzoku.rotation.y - this.getPhase();
}

Handle.prototype = {
    update: function( pageX, pageY ) {
        this.lastX = this.newX;
        this.lastY = this.newY;
        this.newX = pageX;
        this.newY = pageY;
    },

    getPhase: function() {
        var p = this._normalize( this.newX, this.newY );
        return this._getAngle( p.x, p.y ) + this.initialPhase;
    },

    getOmega: function() {
        var n = this._normalize( this.newX, this.newY ),
            l = this._normalize( this.lastX, this.lastY );
        /*
         * マウスでうまく角速度が最大になるタイミングで離すのは難しいので、
         * 速度に比例させてごまかす

        return this._getAngle( n.x, n.y ) - this._getAngle( l.x, l.y );
        */
        var vel = 2 * n.clone().sub(l).length();
        if ( n.x * l.y - n.y * l.x > 0 ) {
            return -vel;
        } else {
            return vel;
        }
    },

    // pageX, pageY を [-1, 1]^2 に正規化
    _normalize: function( pageX, pageY ) {
        var size = renderer.getSize();
        return new THREE.Vector2(
            2 * pageX / size.width - 1,
            -2 * pageY / size.height + 1
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
        return {
            x: w.x + (v.x - w.x) * r,
            y: w.y + (v.y - w.y) * r,
            z: w.z + (v.z - w.z) * r
        };
    }
}

function init() {
    scene = new THREE.Scene();

    // camera
    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 2000 );
    camera.position.set( 1, 1.2, 3.6 );
    camera.lookAt( 0, 0, 0 );
    controls = new THREE.OrbitControls( camera );

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
    document.body.appendChild( renderer.domElement );

    // events
    window.addEventListener( 'resize', onWindowResize, false );

    // mouse events
    renderer.domElement.addEventListener( 'mousedown', OnMouseDown, false);
    renderer.domElement.addEventListener( 'mouseup', OnMouseUp, false);
    renderer.domElement.addEventListener( 'mousemove', OnMouseMove, false);
    renderer.domElement.addEventListener( 'touchstart', OnTouchStart, false);
    renderer.domElement.addEventListener( 'touchend', OnTouchEnd, false);
    renderer.domElement.addEventListener( 'touchmove', OnTouchMove, false);
}

function HandleStart( x, y ) {
    handle = new Handle( x, y );
}
function HandleEnd() {
    omega = handle.getOmega();
    handle = null;
}
function HandleUpdate( x, y ) {
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
    if ( !handle ) return;
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
    if ( !handle || e.touches.length != 1) return;
    HandleUpdate( e.touches[0].pageX, e.touches[0].pageY );
}

function onWindowResize() {
    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

function update() {
    requestAnimationFrame( update );
    controls.update();
    omega *= 0.999;
    if ( minzoku && !handle ) minzoku.rotation.y += omega;
    renderer.render( scene, camera );
}

init();
update();
