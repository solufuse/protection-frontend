import { isNaN } from 'lodash';

function formatPythonValue(value: any): string {
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

export function generateCreateTransformerCode(
    trafoId: number, // A unique ID for the generated transformer variable
    hv_bus: number,
    lv_bus: number,
    params: {
        std_type: string; // For create_transformer
        // Zero sequence parameters for three-phase load flow (if part of std_type implicitly)
        vk0_percent?: number; // default nan
        vkr0_percent?: number; // default nan
        mag0_percent?: number; // default nan
        mag0_rx?: number; // default nan
        si0_hv_partial?: number; // default nan
    } | {
        sn_mva: number; // For create_transformer_from_parameters
        vn_hv_kv: number;
        vn_lv_kv: number;
        vk_percent: number;
        vkr_percent: number;
        pfe_kw: number;
        i0_percent: number;
        shift_degree: number; // default 0.0
        vector_group?: string; // default None
        // Zero sequence parameters for three-phase load flow
        vk0_percent?: number; // default nan
        vkr0_percent?: number; // default nan
        mag0_percent?: number; // default nan
        mag0_rx?: number; // default nan
        si0_hv_partial?: number; // default nan
    },
    name?: string,
    tap_pos?: number, // pandapower default is nan (neutral position)
    in_service: boolean = true,
    index?: number,
    max_loading_percent?: number, // pandapower default is nan
    parallel: number = 1,
    df: number = 1.0,
    tap_changer_type?: string, // pandapower default is None
    tap_dependency_table: boolean = false,
    id_characteristic_table?: number, // pandapower default is None
    pt_percent?: number, // pandapower default is nan
    oltc: boolean = false,
    xn_ohm?: number, // pandapower default is nan
    tap2_pos?: number, // pandapower default is nan (neutral position)
): string {
    let code = `trafo_${trafoId} = `;
    let createFunction = '';
    let commonParams = `net, hv_bus=${hv_bus}, lv_bus=${lv_bus}`;

    if ('std_type' in params) {
        createFunction = 'pandapower.create_transformer';
        commonParams += `, std_type=${formatPythonValue(params.std_type)}`;
        
        // Zero sequence parameters for create_transformer (if implicitly part of std_type)
        if (params.vk0_percent !== undefined) {
            commonParams += `, vk0_percent=${formatPythonValue(params.vk0_percent)}`;
        }
        if (params.vkr0_percent !== undefined) {
            commonParams += `, vkr0_percent=${formatPythonValue(params.vkr0_percent)}`;
        }
        if (params.mag0_percent !== undefined) {
            commonParams += `, mag0_percent=${formatPythonValue(params.mag0_percent)}`;
        }
        if (params.mag0_rx !== undefined) {
            commonParams += `, mag0_rx=${formatPythonValue(params.mag0_rx)}`;
        }
        if (params.si0_hv_partial !== undefined) {
            commonParams += `, si0_hv_partial=${formatPythonValue(params.si0_hv_partial)}`;
        }

    } else if ('sn_mva' in params && 'vn_hv_kv' in params && 'vn_lv_kv' in params && 'vk_percent' in params && 'vkr_percent' in params && 'pfe_kw' in params && 'i0_percent' in params && 'shift_degree' in params) {
        createFunction = 'pandapower.create_transformer_from_parameters';
        commonParams += `, sn_mva=${formatPythonValue(params.sn_mva)}, vn_hv_kv=${formatPythonValue(params.vn_hv_kv)}, vn_lv_kv=${formatPythonValue(params.vn_lv_kv)}, vk_percent=${formatPythonValue(params.vk_percent)}, vkr_percent=${formatPythonValue(params.vkr_percent)}, pfe_kw=${formatPythonValue(params.pfe_kw)}, i0_percent=${formatPythonValue(params.i0_percent)}, shift_degree=${formatPythonValue(params.shift_degree)}`;

        if (params.vector_group !== undefined) {
            commonParams += `, vector_group=${formatPythonValue(params.vector_group)}`;
        }

        // Zero sequence parameters for create_transformer_from_parameters
        if (params.vk0_percent !== undefined) {
            commonParams += `, vk0_percent=${formatPythonValue(params.vk0_percent)}`;
        }
        if (params.vkr0_percent !== undefined) {
            commonParams += `, vkr0_percent=${formatPythonValue(params.vkr0_percent)}`;
        }
        if (params.mag0_percent !== undefined) {
            commonParams += `, mag0_percent=${formatPythonValue(params.mag0_percent)}`;
        }
        if (params.mag0_rx !== undefined) {
            commonParams += `, mag0_rx=${formatPythonValue(params.mag0_rx)}`;
        }
        if (params.si0_hv_partial !== undefined) {
            commonParams += `, si0_hv_partial=${formatPythonValue(params.si0_hv_partial)}`;
        }
    } else {
        throw new Error("Invalid parameters for transformer creation. Must provide either 'std_type' or full parameters for 'create_transformer_from_parameters'.");
    }

    code += `${createFunction}(${commonParams}`;

    if (name !== undefined) {
        code += `, name=${formatPythonValue(name)}`;
    }
    if (tap_pos !== undefined) {
        code += `, tap_pos=${formatPythonValue(tap_pos)}`;
    }
    if (in_service === false) {
        code += `, in_service=${formatPythonValue(in_service)}`;
    }
    if (index !== undefined) {
        code += `, index=${formatPythonValue(index)}`;
    }
    if (max_loading_percent !== undefined) {
        code += `, max_loading_percent=${formatPythonValue(max_loading_percent)}`;
    }
    if (parallel !== 1) {
        code += `, parallel=${formatPythonValue(parallel)}`;
    }
    if (df !== 1.0) {
        code += `, df=${formatPythonValue(df)}`;
    }
    if (tap_changer_type !== undefined) {
        code += `, tap_changer_type=${formatPythonValue(tap_changer_type)}`;
    }
    if (tap_dependency_table === true) {
        code += `, tap_dependency_table=${formatPythonValue(tap_dependency_table)}`;
    }
    if (id_characteristic_table !== undefined) {
        code += `, id_characteristic_table=${formatPythonValue(id_characteristic_table)}`;
    }
    if (pt_percent !== undefined) {
        code += `, pt_percent=${formatPythonValue(pt_percent)}`;
    }
    if (oltc === true) {
        code += `, oltc=${formatPythonValue(oltc)}`;
    }
    if (xn_ohm !== undefined) {
        code += `, xn_ohm=${formatPythonValue(xn_ohm)}`;
    }
    if (tap2_pos !== undefined) {
        code += `, tap2_pos=${formatPythonValue(tap2_pos)}`;
    }

    code += `)`;
    return code;
}