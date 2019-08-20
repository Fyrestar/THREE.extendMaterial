# ShaderMaterialExtend
Plugin for extending built-in materials, instances of ShaderMaterial and shader objects of onBeforeCompile

`THREE.ShaderMaterial.extend( constructor|shaderMaterial [, options])`

For patching in onBeforeCompile:
`THREE.patchShader( object [, options])`


`
const myMaterial = THREE.ShaderMaterial.extend(THREE.MeshPhongMaterial, {

    // Will be prepended to vertex and fragment code
    header: 'varying vec3 vEye;',


    // Insert code lines by hinting at a existing
    vertex: {

        // Inserts the line after #include <fog_vertex>
        
        '#include <fog_vertex>': 'vEye = normalize(cameraPosition - w.xyz);',

        // Replaces a line (@ prefix) inside of the project_vertex include

        'project_vertex': {
            '@vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );': 'vec4 mvPosition = modelViewMatrix * vec4( transformed * 0.5, 1.0 );'
        }
    },
    fragment: {
        '#include <envmap_fragment>': 'diffuseColor.rgb += pow(dot(vNormal, vEye), 3.0);'
    },


    // Properties to apply to the new THREE.ShaderMaterial
    material: {
        skinning: true
    },


    // Uniforms (will be applied to existing or added)
    uniforms: {
        diffuse: new THREE.Color(0xffffff)
    }

});
`
