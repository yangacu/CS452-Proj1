var gl;
var myShaderProgram;
var bufferId;
var coordinatesUniform;
var clipX = 0.0;
var clipY = 0.0;
var xtrans;
var ytrans;
var speed = 0.1;

//////////////////////////////////////////////////////////////////////////
//Shapes

var Triangle = [
	vec2(0.0,0.1),
	vec2(0.1,-0.1),
	vec2(-0.1,-0.1)
];

var Square = [
    vec2(  0.1,0.1 ),
    vec2(  0.1,-0.1 ),
    vec2(  -0.1,-0.1 ),
    vec2( -0.1,0.1 ),
];

var Pentagon = [
	vec2(0.0,0.1),
	vec2(0.1,0.0),
	vec2(0.06,-0.1),
	vec2(-0.06,-0.1),
	vec2(-0.1,0.0)
];

var Hexagon = [
	vec2(-0.05,0.1),
	vec2(0.05,0.1),
	vec2(0.1,0.0),
	vec2(0.05,-0.1),
	vec2(-0.05,-0.1),
	vec2(-0.1,0.0)
];

var Heptagon = [
	vec2(0.0,0.1),
	vec2(0.065,0.06),
	vec2(0.1,-0.02),
	vec2(0.05,-0.1),
	vec2(-0.05,-0.1),
	vec2(-0.1,-0.02),
	vec2(-0.065,0.06)
];

var Octagon = [
	vec2(0.05,0.1),
	vec2(0.1,0.05),
	vec2(0.1,-0.05),
	vec2(0.05,-0.1),
	vec2(-0.05,-0.1),
	vec2(-0.1,-0.05),
	vec2(-0.1,0.05),
	vec2(-0.05,0.1)
];

var AllShapes = [Triangle,Square,Pentagon,Hexagon,Heptagon,Octagon];

////////////////////////////////////////////////////////////////////////////////

/* Functions
1. randShape() - return vertices of a random shape.
Return: vec2 array

*/

function coordOffsetter(){
	var temp = [];
	
	//X-offset
	var offset = Math.random();
	while(offset >= 0.9) offset = Math.random();
	
	if(Math.floor(Math.random()*2) == 1){offset = -offset;}
	temp.push(offset);
	
	//Y-offset
	offset = Math.random();
	while(offset >= 0.9) offset = Math.random();

	if(Math.floor(Math.random()*2) == 1){offset = -offset;}	
	temp.push(offset);
	
	return temp;
}

function randShape(){
	var r = Math.floor(Math.random() * 6);
	var coordOffset = coordOffsetter();
	
	//Need to add coordOffset to each vertice.
	var selectedShape = AllShapes[r];
	for(var i=0; i<selectedShape.length; i++){
		selectedShape[i] = add(coordOffset,selectedShape[i]);
	}
	
	return selectedShape;
}



////////////////////////////////////////////////////////////////////////////////


var chooseShape = randShape();
var chooseShape2 = randShape();

var playerCoord = [];
var stillShapesCoord = [];

var secondShaderProgram;
var secondBufferId;
//var secondCoordUniform;

/*
m - mat3
v - vec2
*/

function transformVec2(m, v){
	var vt = mat3(v[0], 0, 0,
				  v[1], 0, 0,
				  1, 0, 0);

	var result = mult(m,vt);
	return vec2(result[0][0], result[1][0]);
}

/*
shapeVertices - vec2 array
transMatrix - mat3
*/
function transformVec2Array(shapeVertices, transMatrix){
	var temp = [];
	for(var i=0; i<shapeVertices.length; i++){
		temp.push(transformVec2(transMatrix,shapeVertices[i]));
	}
	return temp;
}

/*
Arg: vec2 array
Return: vec2 array

Test: appears to work.
*/
function getEdgeNormals(shapeVertices){
	var numVertices = shapeVertices.length;
	var edgeNormals = [];

	for(var i=0; i<numVertices; i++){
		var p1 = shapeVertices[i];
		var p2 = shapeVertices[i+1 == numVertices ? 0:i+1];

		var edge = subtract(p1,p2);
		var normal = vec2(edge[1],-edge[0]);
		edgeNormals.push(normal);
	}
	return edgeNormals;
}

/*
Arg: vec2 array, vec2
 shapeVertices is an array of vertices,
 axis is an edge normal
Return: vec2

Notes: precision may be a problem.
*/
function projShapeToAxis(shapeVertices, axis){
	var min = dot(shapeVertices[0], axis);
	var max = min;

	for(var i=1; i<shapeVertices.length; i++){
		var p = dot(shapeVertices[i], axis);
		if(p < min) min = p;
		else if(p > max) max = p;
	}
	return vec2(min, max);
}

/*
Arg: vec2, vec2
Return: bool

Test: appears to work
*/
function projOverlap(proj1, proj2){
	//x-coord for proj1 is assumed to be equal or less than the x-coord for proj2
	if (proj1[0] > proj2[0]){
		var temp = proj1;
		proj1 = proj2;
		proj2 = temp;
	}
	if(proj1[0] <= proj2[0] && proj1[1] > proj2[0]){
		return true;
	}
	return false;
}

/*
Arg: vec2 array, vec2 array
 Takes arrays that contain the vertices of a shape.
Return: bool
 If shapes collide, return true. Else return false.
*/
function checkCollision(shape1, shape2){
	var axes1 = getEdgeNormals(shape1);
	var axes2 = getEdgeNormals(shape2);
	
	for(var i=0; i<axes1.length; i++){
		var axis = axes1[i];

		var p1 = projShapeToAxis(shape1, axis);
		var p2 = projShapeToAxis(shape2, axis);

		if(!projOverlap(p1,p2)) return false;
	}

	for(var i=0; i<axes2.length; i++){
		var axis = axes2[i];

		var p1 = projShapeToAxis(shape1, axis);
		var p2 = projShapeToAxis(shape2, axis);

		if(!projOverlap(p1,p2)) return false;
	}
	return true;
}

function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    gl.viewport( 0, 0, 512, 512 );
    gl.clearColor( 1.0, 0.0, 0.0, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT );
    
	randDirection();
	render();
}

function drawShape2(shape,drawMode) {
    secondShaderProgram = initShaders( gl, "square-shader", "fragment-shader");
	gl.useProgram(secondShaderProgram);

	//coordinatesUniform = gl.getUniformLocation(myShaderProgram,"coordinates");
	//gl.uniform2f(coordinatesUniform,0.0,0.0);	

    secondBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, secondBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(shape), gl.STATIC_DRAW );
    
    var myPositionAttrib = gl.getAttribLocation( secondShaderProgram,"myPosition" );
    gl.vertexAttribPointer( myPositionAttrib, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( myPositionAttrib );
    
	gl.bindBuffer(gl.ARRAY_BUFFER, secondBufferId);
	gl.drawArrays(drawMode, 0, shape.length);
	
}



function randDirection(){
	var r = Math.floor(Math.random()*8);
	
	if(r == 0){//north
		xtrans = 0, ytrans = 1;
	} 
	else if(r == 1){//northeast
		xtrans = 1, ytrans = 1;
	}
	else if(r == 2){//east
		xtrans = 1, ytrans = 0;
	}
	else if(r == 3){//southeast
		xtrans = 1, ytrans = -1;
	}
	else if(r == 4){//south
		xtrans = 0, ytrans = -1;
	}
	else if(r == 5){//southwest
		xtrans = -1, ytrans = -1;
	}
	else if(r == 6){//west
		xtrans = -1, ytrans = 0;
	}
	else if(r == 7){//northwest
		xtrans = -1, ytrans = 1;
	}
}

function drawShape() {
	
    myShaderProgram = initShaders( gl, "vertex-shader", "fragment-shader");
	gl.useProgram(myShaderProgram);

	coordinatesUniform = gl.getUniformLocation(myShaderProgram,"coordinates");
	gl.uniform2f(coordinatesUniform,0.0,0.0);	

    bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(Square), gl.STATIC_DRAW );
    
    var myPositionAttrib = gl.getAttribLocation( myShaderProgram,"myPosition" );
    gl.vertexAttribPointer( myPositionAttrib, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( myPositionAttrib );
	
	clipX = clipX + (0.01*speed) * xtrans;
	clipY = clipY + (0.01*speed) * ytrans;
	gl.uniform2f(coordinatesUniform, clipX, clipY);
		
	gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);	

    
}

function moveShape(){
	var cx = event.clientX;
	var cy = event.clientY;

	clipX = 2.0 * cx / 512.0 - 1.0;
	clipY = -(2.0 * cy / 512.0 - 1.0);
	gl.useProgram(myShaderProgram);
	gl.uniform2f(coordinatesUniform, clipX, clipY);
}

function changeDir(event){
	var theKeyCode = event.keyCode;
	//up, down, left, right
	if(theKeyCode == 87){
		ytrans = 1, xtrans = 0;
	}
	else if(theKeyCode == 83){
		ytrans = -1, xtrans = 0;
	}
	else if(theKeyCode == 65){
		ytrans = 0, xtrans = -1;
	}
	else if(theKeyCode == 68){
		ytrans = 0, xtrans = 1;
	}
}

function render(){
	gl.clear( gl.COLOR_BUFFER_BIT );

	drawShape();

	drawShape2(chooseShape, gl.TRIANGLE_FAN);
	drawShape2(chooseShape2, gl.TRIANGLE_FAN);
	
	var translateMatrix = mat3(1.0, 0.0, clipX,
					 0.0, 1.0, clipY,
					 0.0, 0.0, 1.0);
	
	var temp = transformVec2Array(Square, translateMatrix);
	
	console.log(checkCollision(temp,chooseShape));
	requestAnimFrame(render);
	
}