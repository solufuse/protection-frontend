import { isNaN } from 'lodash';

function formatPythonValue(value: any): string {
    if (value === null) { // Handle null explicitly for Python None
        return "None";
    }
    if (typeof value === 'string') {
        return `'${value}'`;
    }
    if (typeof value === 'boolean') {
        return String(value);
    }
    if (typeof value === 'number') {
        if (isNaN(value)) {
            return "float('nan')"; // Use float('nan') for NaN in Python
        }
        return String(value);
    }
    // Handle arrays for geodata specifically (if applicable, though gen doesn't typically have it)
    if (Array.isArray(value) && value.every(item => Array.isArray(item) && item.length === 2 && typeof item[0] === 'number' && typeof item[1] === 'number')) {
        return `[${value.map(coord => `(${coord[0]}, ${coord[1]})`).join(', ')}]`;
    }
    return String(value);
}

export function generateCreateGenCode(
    genId: number, // A unique ID for the generated gen variable
    bus: number,
    p_mw: number,
    vm_pu: number = 1.0,
    sn_mva?: number, // pandapower default is nan
    name?: string,
    index?: number,
    max_q_mvar?: number, // pandapower default is nan
    min_q_mvar?: number, // pandapower default is nan
    min_p_mw?: number, // pandapower default is nan
    max_p_mw?: number, // pandapower default is nan
    min_vm_pu?: number, // pandapower default is nan
    max_vm_pu?: number, // pandapower default is nan
    scaling: number = 1.0,
    type?: string, // pandapower default is None
    slack: boolean = false,
    id_q_capability_characteristic?: number, // pandapower default is None
    reactive_capability_curve: boolean = false,
    curve_style?: string, // pandapower default is None
    controllable?: boolean, // pandapower default is nan
    vn_kv?: number, // pandapower default is nan
    xdss_pu?: number, // pandapower default is nan
    rdss_ohm?: number, // pandapower default is nan
    cos_phi?: number, // pandapower default is nan
    pg_percent?: number, // pandapower default is nan
    power_station_trafo?: number, // pandapower default is nan (actually None in docs, but usually an int ref)
    in_service: boolean = true,
    slack_weight: number = 0.0,
): string {
    let code = `gen_${genId} = pandapower.create_gen(net, bus=${bus}, p_mw=${formatPythonValue(p_mw)}`;

    if (vm_pu !== 1.0) {
        code += `, vm_pu=${formatPythonValue(vm_pu)}`;
    }
    if (sn_mva !== undefined) {
        code += `, sn_mva=${formatPythonValue(sn_mva)}`;
    }
    if (name !== undefined) {
        code += `, name=${formatPythonValue(name)}`;
    }
    if (index !== undefined) {
        code += `, index=${formatPythonValue(index)}`;
    }
    if (max_q_mvar !== undefined) {
        code += `, max_q_mvar=${formatPythonValue(max_q_mvar)}`;
    }
    if (min_q_mvar !== undefined) {
        code += `, min_q_mvar=${formatPythonValue(min_q_mvar)}`;
    }
    if (min_p_mw !== undefined) {
        code += `, min_p_mw=${formatPythonValue(min_p_mw)}`;
    }
    if (max_p_mw !== undefined) {
        code += `, max_p_mw=${formatPythonValue(max_p_mw)}`;
    }
    if (min_vm_pu !== undefined) {
        code += `, min_vm_pu=${formatPythonValue(min_vm_pu)}`;
    }
    if (max_vm_pu !== undefined) {
        code += `, max_vm_pu=${formatPythonValue(max_vm_pu)}`;
    }
    if (scaling !== 1.0) {
        code += `, scaling=${formatPythonValue(scaling)}`;
    }
    if (type !== undefined) {
        code += `, type=${formatPythonValue(type)}`;
    }
    if (slack === true) {
        code += `, slack=${formatPythonValue(slack)}`;
    }
    if (id_q_capability_characteristic !== undefined) {
        code += `, id_q_capability_characteristic=${formatPythonValue(id_q_capability_characteristic)}`;
    }
    if (reactive_capability_curve === true) {
        code += `, reactive_capability_curve=${formatPythonValue(reactive_capability_curve)}`;
    }
    if (curve_style !== undefined) {
        code += `, curve_style=${formatPythonValue(curve_style)}`;
    }
    if (controllable !== undefined) {
        code += `, controllable=${formatPythonValue(controllable)}`;
    }
    if (vn_kv !== undefined) {
        code += `, vn_kv=${formatPythonValue(vn_kv)}`;
    }
    if (xdss_pu !== undefined) {
        code += `, xdss_pu=${formatPythonValue(xdss_pu)}`;
    }
    if (rdss_ohm !== undefined) {
        code += `, rdss_ohm=${formatPythonValue(rdss_ohm)}`;
    }
    if (cos_phi !== undefined) {
        code += `, cos_phi=${formatPythonValue(cos_phi)}`;
    }
    if (pg_percent !== undefined) {
        code += `, pg_percent=${formatPythonValue(pg_percent)}`;
    }
    if (power_station_trafo !== undefined) {
        code += `, power_station_trafo=${formatPythonValue(power_station_trafo)}`;
    }
    if (in_service === false) {
        code += `, in_service=${formatPythonValue(in_service)}`;
    }
    if (slack_weight !== 0.0) {
        code += `, slack_weight=${formatPythonValue(slack_weight)}`;
    }

    code += `)`;
    return code;
}