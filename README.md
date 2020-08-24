# Extending Materials
Plugin for extending built-in materials, instances of ShaderMaterial and built-in materials as well as shader objects of onBeforeCompile

`THREE.extendMaterial( constructor|material|shaderMaterial [, options])`

For patching in onBeforeCompile:
`THREE.patchShader( object [, options])`


```javascript
const myMaterial = THREE.extendMaterial(THREE.MeshPhongMaterial, {

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


    // Uniforms (will be applied to existing or added) as value or uniform object
    uniforms: {
        diffuse: new THREE.Color(0xffffff),
        emissive: {
            value: new THREE.Color('pink')
        }
    }

});
```

## Patching shader code

Code can be appended, prepended and replaced by providing some indicating line code (typically includes like above) and a prefix to define if the code should be appended, prepended to the hinted line or replace it.

Prefix | Insertion
--- | ---
none | append
? | prepend
@ | replace

## Inheritation

It is possible to inherit materials and their actual shader code patches recursively. This is useful when creating alternative versions of a material with a different kind of base material, for example a MeshDepthMaterial.

```javascript
const depthMaterial = THREE.extendMaterial( THREE.MeshDepthMaterial, {
	
	extends: aExtendedMaterial
	
});
```

# Release notes

## Version 2

- Alias `THREE.extendMaterial` as shorter alternative to `THREE.ShaderMaterial.extend`
- Fixed compatibility with minified THREE bundles
- Inheritation (applying of previous code patches and inheriting properties)
- Uniforms can be given now as wrapper-object or their value
- Sharing of uniform wrapper by defining a shared `{shared: true, value: .. }` boolean in a uniform object
- vertexHeader, fragmentHeader, vertexEnd, fragmentEnd added wich will only add the given string to the corresponding part while the "End" ones will add the string at the end of the main function
- Constants (defines) which are a boolean false will get removed as they are mainly used with #ifdef in THREE what causes a false positive for this condition


## TODO

- Adding more logic entry points to patch like `transform`, `lights` which are shared across all materials, as a shorter approach to hinting explicitly to lines
- Filtering out unused uniforms
