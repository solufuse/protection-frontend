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
    return String(value);
}

export function generateCreateSgenCode(
    sgenId: number, // A unique ID for the generated sgen variable
    bus: number,
    params: {
        p_mw: number; // For create_sgen
        q_mvar?: number; // Default 0
        sn_mva?: number; // Default NaN
        scaling?: number; // Default 1.0
        type?: 'wye' | 'delta'; // For create_sgen, or custom string type
        in_service?: boolean; // Default true
        max_p_mw?: number; // Default NaN
        min_p_mw?: number; // Default NaN
        max_q_mvar?: number; // Default NaN
        min_q_mvar?: number; // Default NaN
        controllable?: boolean; // Default NaN
        k?: number; // Default NaN
        rx?: number; // Default NaN
        id_q_capability_characteristic?: number; // Default None
        reactive_capability_curve?: boolean; // Default false
        curve_style?: string; // Default None
        current_source?: boolean; // Default true
        generator_type?: 'current_source' | 'async' | 'async_doubly_fed'; // Default None
        max_ik_ka?: number; // Default NaN
        kappa?: number; // Default NaN
        lrc_pu?: number; // Default NaN
    } | {
        sn_mva: number; // For create_sgen_from_cosphi
        cos_phi: number;
        mode: 'underexcited' | 'overexcited'; // For create_sgen_from_cosphi
        // Common optional parameters also apply here if create_sgen_from_cosphi supports them,
        // but pandapower docs often simplify the common params for these helper functions.
        // We'll assume the common parameters can be passed through kwargs for simplicity if needed
        // but for now, we'll only generate the specific params for this helper.
    },
    name?: string,
    index?: number,
): string {
    let code = `sgen_${sgenId} = `;
    let createFunction = '';
    let commonParams = `net, bus=${formatPythonValue(bus)}`;

    if ('p_mw' in params) {
        createFunction = 'pandapower.create_sgen';
        commonParams += `, p_mw=${formatPythonValue(params.p_mw)}`;

        if (params.q_mvar !== undefined && params.q_mvar !== 0) {
            commonParams += `, q_mvar=${formatPythonValue(params.q_mvar)}`;
        }
        if (params.sn_mva !== undefined) {
            commonParams += `, sn_mva=${formatPythonValue(params.sn_mva)}`;
        }
        if (params.scaling !== undefined && params.scaling !== 1.0) {
            commonParams += `, scaling=${formatPythonValue(params.scaling)}`;
        }
        if (params.type !== undefined) {
            commonParams += `, type=${formatPythonValue(params.type)}`;
        }
        if (params.in_service === false) {
            commonParams += `, in_service=${formatPythonValue(params.in_service)}`;
        }
        if (params.max_p_mw !== undefined) {
            commonParams += `, max_p_mw=${formatPythonValue(params.max_p_mw)}`;
        }
        if (params.min_p_mw !== undefined) {
            commonParams += `, min_p_mw=${formatPythonValue(params.min_p_mw)}`;
        }
        if (params.max_q_mvar !== undefined) {
            commonParams += `, max_q_mvar=${formatPythonValue(params.max_q_mvar)}`;
        }
        if (params.min_q_mvar !== undefined) {
            commonParams += `, min_q_mvar=${formatPythonValue(params.min_q_mvar)}`;
        }
        if (params.controllable !== undefined) {
            commonParams += `, controllable=${formatPythonValue(params.controllable)}`;
        }
        if (params.k !== undefined) {
            commonParams += `, k=${formatPythonValue(params.k)}`;
        }
        if (params.rx !== undefined) {
            commonParams += `, rx=${formatPythonValue(params.rx)}`;
        }
        if (params.id_q_capability_characteristic !== undefined) {
            commonParams += `, id_q_capability_characteristic=${formatPythonValue(params.id_q_capability_characteristic)}`;
        }
        if (params.reactive_capability_curve !== undefined && params.reactive_capability_curve === true) {
            commonParams += `, reactive_capability_curve=${formatPythonValue(params.reactive_capability_curve)}`;
        }
        if (params.curve_style !== undefined) {
            commonParams += `, curve_style=${formatPythonValue(params.curve_style)}`;
        }
        if (params.current_source === false) {
            commonParams += `, current_source=${formatPythonValue(params.current_source)}`;
        }
        if (params.generator_type !== undefined) {
            commonParams += `, generator_type=${formatPythonValue(params.generator_type)}`;
        }
        if (params.max_ik_ka !== undefined) {
            commonParams += `, max_ik_ka=${formatPythonValue(params.max_ik_ka)}`;
        }
        if (params.kappa !== undefined) {
            commonParams += `, kappa=${formatPythonValue(params.kappa)}`;
        }
        if (params.lrc_pu !== undefined) {
            commonParams += `, lrc_pu=${formatPythonValue(params.lrc_pu)}`;
        }

    } else if ('sn_mva' in params && 'cos_phi' in params && 'mode' in params) {
        createFunction = 'pandapower.create_sgen_from_cosphi';
        commonParams += `, sn_mva=${formatPythonValue(params.sn_mva)}, cos_phi=${formatPythonValue(params.cos_phi)}, mode=${formatPythonValue(params.mode)}`;
    }

    code += `${createFunction}(${commonParams}`;

    if (name !== undefined) {
        code += `, name=${formatPythonValue(name)}`;
    }
    if (index !== undefined) {
        code += `, index=${formatPythonValue(index)}`;
    }

    code += `)`;
    return code;
}