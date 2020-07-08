// Author: Fyrestar https://mevedia.com (https://github.com/Fyrestar/ShaderMaterialExtend)
THREE.ShaderMaterial.extend = function () {

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

	function applyPatches(chunk, map) {

		for ( let name in map ) {

			const value = map[name];

			if ( value instanceof Object ) {

				if ( THREE.ShaderChunk[name] === undefined ) {

					console.error('THREE.ShaderMaterial.extend: ShaderChunk "%s" not found', name);

				} else {

					chunk = chunk.replace('#include <' + name + '>', applyPatches(THREE.ShaderChunk[name], value) );

				}

			} else {

				if ( name[0] === '@' ) {

					const line = name.substr(1);

					chunk = chunk.replace(line, value);

				} else if ( name[0] === '?' ) {

					const line = name.substr(1);

					chunk = chunk.replace(line, value + '\n' + line);

				} else {

					chunk = chunk.replace(name, name + '\n' + value);

				}

			}

		}

		return chunk;

	}

	function applyUniforms(src, dst, defines) {

		if ( src.uniforms !== undefined ) {

			for ( let name in src.uniforms ) {

				if ( !dst.uniforms[name] )
					dst.uniforms[name] = {};

				dst.uniforms[name].value = src.uniforms[name];


				if ( defines && mapFlags[name] !== undefined )
					defines[mapFlags[name]] = true;


				const flag = uniformFlags[name];

				if ( defines && flag !== undefined && ( flag.not === undefined || flag.not !== src.uniforms[name] ) )
					defines[flag.as] = src.uniforms[name];
			}

		}
	}

	THREE.mapShader = function(name, type) {

		const mapping = mappings[ name ];

		return THREE.ShaderChunk[mapping.id + '_' + ( type === 'vertex' ? 'vert' : 'frag' )];

	};

	THREE.patchShader = function(shader, object) {

		// A shared header ( varyings, uniforms, functions etc )

		let header = ( object.header || '' ) + '\n';
		let vertexShader = shader.vertexShader;
		let fragmentShader = shader.fragmentShader;

		// Insert or replace lines (@ to replace)

		if ( object.vertex !== undefined )
			vertexShader = applyPatches(vertexShader, object.vertex);


		if ( object.fragment !== undefined )
			fragmentShader = applyPatches(fragmentShader, object.fragment);


		shader.vertexShader = header + vertexShader;
		shader.fragmentShader = header + fragmentShader;

		applyUniforms(object, shader);


		return shader;

	};

	return function(source, object) {

		object = object || {};



		// Extend from class or shader material

		let uniforms, vertexShader = '', fragmentShader = '';

		const material = new THREE.ShaderMaterial;
		const properties = object.material || {};
		const defines = properties.defines || {};

		if ( source instanceof Function ) {

			const mapping = mappings[ source.name ];

			if ( mapping === undefined ) {

				console.error('THREE.ShaderMaterial.extend: no mapping for material class "%s" found', source.name);

				return material;

			}

			uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib[mapping.name].uniforms);
			vertexShader = THREE.ShaderChunk[mapping.id + '_vert'];
			fragmentShader = THREE.ShaderChunk[mapping.id + '_frag'];

			properties.lights = properties.lights === undefined ? true : properties.lights;

		} else if ( source.isShaderMaterial ) {

			uniforms = THREE.UniformsUtils.clone(source.uniforms);
			vertexShader = source.vertexShader;
			fragmentShader = source.fragmentShader;

			material.copy(source);


			if ( source.defines )
				Object.assign(defines, source.defines);

		} else {

			const mapping = mappings[ source.constructor.name ];

			if ( mapping === undefined ) {

				console.error('THREE.ShaderMaterial.extend: no mapping for material class "%s" found', source.constructor.name);

				return material;

			}

			uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib[mapping.name].uniforms);
			vertexShader = THREE.ShaderChunk[mapping.id + '_vert'];
			fragmentShader = THREE.ShaderChunk[mapping.id + '_frag'];

			properties.lights = properties.lights === undefined ? true : properties.lights;

			// Apply properties to uniforms

			for ( let name in uniforms )
				if ( source[name] )
					uniforms[name].value = source[name];

		}

		// Override constants

		if ( object.defines )
			Object.assign(defines, object.defines);


		// A shared header ( varyings, uniforms, functions etc )

		let header = ( object.header || '' ) + '\n';


		// Append, prepend (? prefix) or replace (@ prefix)

		if ( object.vertex !== undefined )
			vertexShader = applyPatches(vertexShader, object.vertex);


		if ( object.fragment !== undefined )
			fragmentShader = applyPatches(fragmentShader, object.fragment);


		properties.defines = defines;
		properties.uniforms = uniforms;
		properties.vertexShader = header + vertexShader;
		properties.fragmentShader = header + fragmentShader;


		// Assign uniforms

		applyUniforms(object, properties, defines);


		material.setValues(properties);

		return material;


	}

}();
