// Author: Fyrestar https://mevedia.com (https://github.com/Fyrestar/ShaderMaterialExtend)
THREE.extendMaterial = THREE.ShaderMaterial.extend = function () {

	const Materials = [
		THREE.ShadowMaterial,
		THREE.SpriteMaterial,
		THREE.RawShaderMaterial,
		THREE.ShaderMaterial,
		THREE.PointsMaterial,
		THREE.MeshPhysicalMaterial,
		THREE.MeshStandardMaterial,
		THREE.MeshPhongMaterial,
		THREE.MeshToonMaterial,
		THREE.MeshNormalMaterial,
		THREE.MeshLambertMaterial,
		THREE.MeshDepthMaterial,
		THREE.MeshDistanceMaterial,
		THREE.MeshBasicMaterial,
		THREE.MeshMatcapMaterial,
		THREE.LineDashedMaterial,
		THREE.LineBasicMaterial,
		THREE.Material,
		THREE.MeshFaceMaterial,
		THREE.MultiMaterial,
		THREE.PointCloudMaterial,
		THREE.ParticleBasicMaterial,
		THREE.ParticleSystemMaterial
	];
	
	// Type on prototype needed to identify when minified

	THREE.ShadowMaterial.prototype.type = 'ShadowMaterial';
	THREE.SpriteMaterial.prototype.type = 'SpriteMaterial';
	THREE.RawShaderMaterial.prototype.type = 'RawShaderMaterial';
	THREE.ShaderMaterial.prototype.type = 'ShaderMaterial';
	THREE.PointsMaterial.prototype.type = 'PointsMaterial';
	THREE.MeshPhysicalMaterial.prototype.type = 'MeshPhysicalMaterial';
	THREE.MeshStandardMaterial.prototype.type = 'MeshStandardMaterial';
	THREE.MeshPhongMaterial.prototype.type = 'MeshPhongMaterial';
	THREE.MeshToonMaterial.prototype.type = 'MeshToonMaterial';
	THREE.MeshNormalMaterial.prototype.type = 'MeshNormalMaterial';
	THREE.MeshLambertMaterial.prototype.type = 'MeshLambertMaterial';
	THREE.MeshDepthMaterial.prototype.type = 'MeshDepthMaterial';
	THREE.MeshDistanceMaterial.prototype.type = 'MeshDistanceMaterial';
	THREE.MeshBasicMaterial.prototype.type = 'MeshBasicMaterial';
	THREE.MeshMatcapMaterial.prototype.type = 'MeshMatcapMaterial';
	THREE.LineDashedMaterial.prototype.type = 'LineDashedMaterial';
	THREE.LineBasicMaterial.prototype.type = 'LineBasicMaterial';
	THREE.Material.prototype.type = 'Material';
	THREE.MeshFaceMaterial.prototype.type = 'MeshFaceMaterial';
	THREE.MultiMaterial.prototype.type = 'MultiMaterial';
	THREE.PointCloudMaterial.prototype.type = 'PointCloudMaterial';
	THREE.ParticleBasicMaterial.prototype.type = 'ParticleBasicMaterial';
	THREE.ParticleSystemMaterial.prototype.type = 'ParticleSystemMaterial';


	for ( let constructor of Materials )
		constructor.prototype.templates = [];


	const mappings = {
		MeshLambertMaterial: {
			id: 'meshlambert',
			name: 'lambert'
		},
		MeshBasicMaterial: {
			id: 'meshbasic',
			name: 'basic'
		},
		MeshStandardMaterial: {
			id: 'meshphysical',
			name: 'physical'
		},
		MeshPhongMaterial: {
			id: 'meshphong',
			name: 'phong'
		},
		MeshMatcapMaterial: {
			id: 'meshmatcap',
			name: 'matcap'
		},
		PointsMaterial: {
			id: 'points',
			name: 'points'
		},
		LineDashedMaterial: {
			id: 'dashed',
			name: 'linedashed'
		},
		MeshDepthMaterial: {
			id: 'depth',
			name: 'depth'
		},
		MeshNormalMaterial: {
			id: 'normal',
			name: 'normal'
		},
		MeshDistanceMaterial: {
			id: 'distanceRGBA',
			name: 'distanceRGBA'
		},
		SpriteMaterial: {
			id: 'sprite',
			name: 'sprite'
		}
	};

	const uniformFlags = {
		alphaTest: {
			as: 'ALPHATEST',
			not: 0
		}
	};

	const mapFlags = {
		map: 'USE_MAP',
		aoMap: 'USE_AOMAP',
		envMap: 'USE_ENVMAP',
		bumpMap: 'USE_BUMPMAP',
		normalMap: 'USE_NORMALMAP',
		lightMap: 'USE_LIGHTMAP',
		emissiveMap: 'USE_EMISSIVEMAP',
		specularMap: 'USE_SPECULARMAP',
		roughnessMap: 'USE_ROUGHNESSMAP',
		metalnessMap: 'USE_METALNESSMAP',
		alphaMap: 'USE_ALPHAMAP',
		displacementMap: 'USE_DISPLACEMENTMAP'
	};


	function cloneUniforms( src ) {

		const dst = {};

		for ( let u in src ) {

			const uniform = src[ u ];

			if ( uniform.shared ) {

				dst[ u ] = uniform;

				continue;

			} else {

				dst[ u ] = {};

			}


			for ( let p in uniform ) {


				const property = uniform[ p ];

				if ( property && ( property.isColor ||
					property.isMatrix3 || property.isMatrix4 ||
					property.isVector2 || property.isVector3 || property.isVector4 ||
					property.isTexture ) ) {

					dst[ u ][ p ] = property.clone();

				} else if ( Array.isArray( property ) ) {

					dst[ u ][ p ] = property.slice();

				} else {

					dst[ u ][ p ] = property;

				}

			}

		}

		return dst;

	}

	function applyPatches( chunk, map ) {

		for ( let name in map ) {

			const value = map[ name ];

			if ( value instanceof Object ) {

				if ( THREE.ShaderChunk[ name ] === undefined ) {

					console.error( 'THREE.ShaderMaterial.extend: ShaderChunk "%s" not found', name );

				} else {

					chunk = chunk.replace( '#include <' + name + '>', applyPatches( THREE.ShaderChunk[ name ], value ) );

				}

			} else {


				if ( name[ 0 ] === '@' ) {

					// Replace

					const line = name.substr( 1 );

					chunk = chunk.replace( line, value );

				} else if ( name[ 0 ] === '?' ) {

					// Insert before

					const line = name.substr( 1 );

					chunk = chunk.replace( line, value + '\n' + line );

				} else {

					// Insert after

					if ( !chunk ) {

						console.error( "THREE.patchShader: chunk not found '%s'", name );

					} else {

						chunk = chunk.replace( name, name + '\n' + value );

					}

				}

			}

		}

		return chunk;

	}

	function applyUniforms( src, dst, defines ) {

		if ( src.uniforms !== undefined ) {

			for ( let name in src.uniforms ) {

				if ( !dst.uniforms[ name ] )
					dst.uniforms[ name ] = {};


				const object = src.uniforms[ name ];

				let value = object;

				// Accepts uniform objects and plain values

				if ( object && object.value !== undefined ) {

					dst.uniforms[ name ] = object;
					value = object.value;

				} else {

					dst.uniforms[ name ].value = object;

				}


				// Maps require USE_X constants

				if ( defines && mapFlags[ name ] !== undefined && object && object.value )
					defines[ mapFlags[ name ] ] = true;


				// Converts properties like alphaTest to their constant

				const flag = uniformFlags[ name ];

				if ( defines && flag !== undefined && ( flag.not === undefined || flag.not !== value ) )
					defines[ flag.as ] = value;

			}

		}
	}

	THREE.mapShader = function ( name, type ) {

		const mapping = mappings[ name ];

		return THREE.ShaderChunk[ mapping.id + '_' + ( type === 'vertex' ? 'vert' : 'frag' ) ];

	};

	THREE.patchShader = function ( shader, object ) {

		// A shared header ( varyings, uniforms, functions etc )

		let header = ( object.header || '' ) + '\n';
		let vertexShader = ( object.vertexHeader || '' ) + shader.vertexShader;
		let fragmentShader = ( object.fragmentHeader || '' ) + shader.fragmentShader;

		if ( object.vertexEnd )
			vertexShader = vertexShader.replace( /\}(?=[^.]*$)/g, object.vertexEnd + '\n}' );

		if ( object.fragmentEnd )
			fragmentShader = fragmentShader.replace( /\}(?=[^.]*$)/g, object.fragmentEnd + '\n}' );

		// Insert or replace lines (@ to replace)

		if ( object.vertex !== undefined )
			vertexShader = applyPatches( vertexShader, object.vertex );


		if ( object.fragment !== undefined )
			fragmentShader = applyPatches( fragmentShader, object.fragment );


		shader.vertexShader = header + vertexShader;
		shader.fragmentShader = header + fragmentShader;

		applyUniforms( object, shader );


		return shader;

	};



	const _clone = THREE.ShaderMaterial.prototype.clone;

	THREE.ShaderMaterial.prototype.clone = function() {

		const clone = _clone.call( this );

		clone.templates = this.templates;

		return clone;

	};


	return function ( source, object ) {

		object = object || {};


		// Extend from class or shader material

		let uniforms, vertexShader = '', fragmentShader = '';


		// Inherit from previous material templates chain

		const inherit = object.inherit || object.extends;

		// New shader material

		const material = new THREE.ShaderMaterial;
		const properties = object.material || {};
		const defines = Object.assign( {}, properties.defines );


		// Inherit constants and uniforms

		if ( inherit && inherit.defines )
			Object.assign( defines, inherit.defines );

		if ( inherit && inherit.uniforms )
			uniforms = inherit.uniforms;


		// Create new template chain

		material.templates = [ object ];


		if ( source instanceof Function ) {

			// Source is a constructor

			const name = source.prototype.type;
			const mapping = mappings[ name ];

			if ( mapping === undefined ) {

				console.error( 'THREE.ShaderMaterial.extend: no mapping for material class "%s" found', name );

				return material;

			}

			uniforms = uniforms || cloneUniforms( THREE.ShaderLib[ mapping.name ].uniforms );
			vertexShader = THREE.ShaderChunk[ mapping.id + '_vert' ];
			fragmentShader = THREE.ShaderChunk[ mapping.id + '_frag' ];

			properties.lights = properties.lights === undefined ? true : properties.lights;

		} else if ( source.isShaderMaterial ) {

			// Source is a ShaderMaterial

			uniforms = uniforms || cloneUniforms( source.uniforms );
			vertexShader = source.vertexShader;
			fragmentShader = source.fragmentShader;

			material.copy( source );

			if ( source.defines )
				Object.assign( defines, source.defines );

		} else {

			// Source is a material instance

			const name = source.type;
			const mapping = mappings[ name ];

			if ( mapping === undefined ) {

				console.error( 'THREE.ShaderMaterial.extend: no mapping for material class "%s" found', name );

				return material;

			}

			uniforms = uniforms || cloneUniforms( THREE.ShaderLib[ mapping.name ].uniforms );
			vertexShader = THREE.ShaderChunk[ mapping.id + '_vert' ];
			fragmentShader = THREE.ShaderChunk[ mapping.id + '_frag' ];

			properties.lights = properties.lights === undefined ? true : properties.lights;

			// Apply properties to uniforms

			for ( let name in uniforms )
				if ( source[ name ] !== undefined )
					uniforms[ name ].value = source[ name ];

		}

		// Override constants

		if ( object.defines )
			Object.assign( defines, object.defines );


		// A shared header ( varyings, uniforms, functions etc )

		let header = ( object.header || '' ) + '\n';


		// Insert or replace lines (@ to replace)

		if ( object.vertex !== undefined )
			vertexShader = applyPatches( vertexShader, object.vertex );


		if ( object.fragment !== undefined )
			fragmentShader = applyPatches( fragmentShader, object.fragment );


		properties.defines = defines;
		properties.uniforms = uniforms;
		properties.vertexShader = header + ( object.vertexHeader || '' ) + vertexShader;
		properties.fragmentShader = header + ( object.fragmentHeader || '' ) + fragmentShader;

		if ( object.vertexEnd )
			properties.vertexShader = properties.vertexShader.replace( /\}(?=[^.]*$)/g, object.vertexEnd + '\n}' );

		if ( object.fragmentEnd )
			properties.fragmentShader = properties.fragmentShader.replace( /\}(?=[^.]*$)/g, object.fragmentEnd + '\n}' );


		// Assign uniforms

		applyUniforms( object, properties, defines );


		material.setValues( properties );


		if ( inherit && inherit.templates && inherit.templates.length ) {

			for ( let template of inherit.templates ) {

				delete template.uniforms;

				THREE.patchShader( material, template );
			}

		}


		// Fix: since we use #ifdef false would be false positive

		for ( let name in defines )
			if ( defines[ name ] === false )
				delete defines[ name ];


		return material;


	}

}();
