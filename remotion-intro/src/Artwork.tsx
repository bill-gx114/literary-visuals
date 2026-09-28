import React, {useLayoutEffect, useRef} from 'react';
import {shaders} from './shaders';

export type ArtName = keyof typeof shaders;
type GLState = {gl: WebGLRenderingContext; program: WebGLProgram; buffer: WebGLBuffer; vertex: WebGLShader; fragment: WebGLShader};

// No wall-clock animation: seeking to a frame always draws that exact artwork time.
export const Artwork: React.FC<{name: ArtName; time: number; resolution?: number; style?: React.CSSProperties}> = ({name, time, resolution=800, style}) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef<GLState | null>(null);
  useLayoutEffect(() => {
    const gl = canvas.current!.getContext('webgl', {alpha:false, antialias:false, preserveDrawingBuffer:true});
    if (!gl) throw new Error('WebGL unavailable; render with --gl=angle.');
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed');
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}');
    const fragment = compile(gl.FRAGMENT_SHADER, shaders[name]);
    const program = gl.createProgram()!;
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Shader link failed');
    gl.useProgram(program);
    const buffer = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(program, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
    state.current = {gl, program, buffer, vertex, fragment};
    return () => {
      gl.deleteBuffer(buffer); gl.deleteProgram(program); gl.deleteShader(vertex); gl.deleteShader(fragment);
      state.current = null;
    };
  }, [name]);
  useLayoutEffect(() => {
    const {gl, program} = state.current!;
    gl.viewport(0,0,resolution,resolution*1.25); gl.useProgram(program);
    gl.uniform2f(gl.getUniformLocation(program,'res'),resolution,resolution*1.25);
    gl.uniform1f(gl.getUniformLocation(program,'time'),time);
    gl.uniform1f(gl.getUniformLocation(program,'force'),name === 'artificialSky' ? .45 : .55);
    gl.uniform1f(gl.getUniformLocation(program,'evening'),1);
    gl.uniform1i(gl.getUniformLocation(program,'mode'),2);
    gl.drawArrays(gl.TRIANGLES,0,6); gl.finish();
  }, [name, time, resolution]);
  return <canvas ref={canvas} width={resolution} height={resolution*1.25} style={{display:'block',width:'100%',height:'100%',objectFit:'cover',...style}}/>;
};
