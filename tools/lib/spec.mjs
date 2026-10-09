// Independently authored conservative contract. Names were cross-checked against
// Microsoft component documentation and Mojang 46ba6ea particle metadata.
export const expr = { anyOf: [{ type: 'number' }, { type: 'string', minLength: 1 }] };
const number = { type: 'number' }, bool = { type: 'boolean' }, string = { type: 'string' };
const vector = (n, item = expr) => ({ type: 'array', items: item, minItems: n, maxItems: n });
const object = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false });
const direction = { anyOf: [vector(3), { enum: ['inwards', 'outwards'] }] };
const names = { anyOf: [string, { type: 'array', items: string }] };
const timeline = { type: 'object', additionalProperties: names };
const lifeEvents = { creation_event: names, expiration_event: names, timeline };
const shape = { offset: vector(3), direction, surface_only: bool };
const uv = object({ texture_width: { type: 'number', exclusiveMinimum: 0 }, texture_height: { type: 'number', exclusiveMinimum: 0 }, uv: vector(2), uv_size: vector(2), flipbook: object({ base_UV: vector(2), size_UV: vector(2, number), step_UV: vector(2, number), frames_per_second: { type: 'number', minimum: 0 }, max_frame: expr, stretch_to_lifetime: bool, loop: bool }, ['base_UV', 'max_frame']) });
const color = { anyOf: [vector(4), { type: 'string' }, object({ interpolant: expr, gradient: { type: 'object', additionalProperties: { anyOf: [string, vector(4)] } } }, ['interpolant', 'gradient'])] };
export const components = {
  'minecraft:emitter_local_space': object({ position: bool, rotation: bool, velocity: bool }),
  'minecraft:emitter_initialization': object({ creation_expression: expr, per_update_expression: expr }),
  'minecraft:emitter_rate_instant': object({ num_particles: expr }),
  'minecraft:emitter_rate_steady': object({ spawn_rate: expr, max_particles: expr }),
  'minecraft:emitter_rate_manual': object({ max_particles: expr }),
  'minecraft:emitter_lifetime_once': object({ active_time: expr }),
  'minecraft:emitter_lifetime_looping': object({ active_time: expr, sleep_time: expr }),
  'minecraft:emitter_lifetime_expression': object({ activation_expression: expr, expiration_expression: expr }),
  'minecraft:emitter_lifetime_events': object({ ...lifeEvents, travel_distance_events: timeline, looping_travel_distance_events: { type: 'array', items: object({ distance: number, effects: names }, ['distance', 'effects']) } }),
  'minecraft:emitter_shape_point': object({ offset: vector(3), direction }),
  'minecraft:emitter_shape_sphere': object({ ...shape, radius: expr }),
  'minecraft:emitter_shape_disc': object({ ...shape, radius: expr, plane_normal: { anyOf: [vector(3), { enum: ['x', 'y', 'z'] }] } }),
  'minecraft:emitter_shape_box': object({ ...shape, half_dimensions: vector(3) }),
  'minecraft:emitter_shape_custom': object({ offset: vector(3), direction }),
  'minecraft:emitter_shape_entity_aabb': object({ direction, surface_only: bool }),
  'minecraft:particle_initial_speed': { anyOf: [expr, vector(3)] },
  'minecraft:particle_initial_spin': object({ rotation: expr, rotation_rate: expr }),
  'minecraft:particle_initialization': object({ per_update_expression: expr, per_render_expression: expr }),
  'minecraft:particle_lifetime_expression': object({ max_lifetime: expr, expiration_expression: expr }),
  'minecraft:particle_lifetime_events': object(lifeEvents),
  'minecraft:particle_expire_if_in_blocks': { type: 'array', items: string },
  'minecraft:particle_expire_if_not_in_blocks': { type: 'array', items: string },
  'minecraft:particle_kill_plane': vector(4, number),
  'minecraft:particle_motion_dynamic': object({ linear_acceleration: vector(3), linear_drag_coefficient: expr, rotation_acceleration: expr, rotation_drag_coefficient: expr }),
  'minecraft:particle_motion_parametric': object({ relative_position: vector(3), direction: vector(3), rotation: expr }),
  'minecraft:particle_motion_collision': object({ enabled: expr, collision_drag: number, coefficient_of_restitution: number, collision_radius: { type: 'number', minimum: 0, maximum: 0.5 }, expire_on_contact: bool, events: { anyOf: [object({ event: string, min_speed: number }, ['event']), { type: 'array', items: object({ event: string, min_speed: number }, ['event']) }] } }, ['collision_radius']),
  'minecraft:particle_appearance_billboard': object({ size: vector(2), facing_camera_mode: { enum: ['rotate_xyz', 'rotate_y', 'lookat_xyz', 'lookat_y', 'direction_x', 'direction_y', 'direction_z', 'lookat_direction', 'emitter_transform_xy', 'emitter_transform_xz', 'emitter_transform_yz'] }, direction: object({ mode: { enum: ['derive_from_velocity', 'custom'] }, min_speed_threshold: number, custom_direction: vector(3) }), uv }, ['size']),
  'minecraft:particle_appearance_tinting': object({ color }, ['color']),
  'minecraft:particle_appearance_lighting': object({})
};
export const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://mcbe-particle-master-ai.local/schemas/particle.schema.json',
  ...object({ format_version: { enum: ['1.10.0', '1.21.10'] }, particle_effect: object({
    description: object({ identifier: { type: 'string', pattern: '^[a-z0-9_.-]+:[a-z0-9_./-]+$' }, basic_render_parameters: object({ material: { type: 'string', minLength: 1 }, texture: { type: 'string', minLength: 1 } }, ['material', 'texture']) }, ['identifier', 'basic_render_parameters']),
    components: object(components),
    curves: { type: 'object', additionalProperties: object({ type: { enum: ['linear', 'bezier', 'catmull_rom', 'bezier_chain'] }, input: expr, horizontal_range: expr, nodes: { anyOf: [{ type: 'array', items: expr }, { type: 'object', additionalProperties: object({ value: expr, slope: expr, left_value: expr, left_slope: expr, right_value: expr, right_slope: expr }) }] } }, ['type', 'input', 'nodes']) },
    events: { type: 'object', additionalProperties: { $ref: '#/definitions/event' } }
  }, ['description', 'components']) }, ['format_version', 'particle_effect']),
  definitions: { event: object({ expression: expr, log: string, weight: number, particle_effect: object({ effect: string, type: { enum: ['emitter', 'emitter_bound', 'particle', 'particle_with_velocity'] }, pre_effect_expression: expr }, ['effect', 'type']), sound_effect: object({ event_name: string }, ['event_name']), sequence: { type: 'array', items: { $ref: '#/definitions/event' } }, randomize: { type: 'array', items: { $ref: '#/definitions/event' } } }) }
};
export const builtinVariables = ['emitter_age', 'emitter_lifetime', 'entity_scale', 'particle_age', 'particle_lifetime', ...[1,2,3,4].flatMap(i => [`emitter_random_${i}`, `particle_random_${i}`])].map(x => `variable.${x}`);
export const mathFunctions = ['abs','acos','asin','atan','atan2','ceil','clamp','cos','die_roll','die_roll_integer','exp','floor','hermite_blend','lerp','lerprotate','ln','max','min','mod','pi','pow','random','random_integer','round','sin','sqrt','trunc'];
