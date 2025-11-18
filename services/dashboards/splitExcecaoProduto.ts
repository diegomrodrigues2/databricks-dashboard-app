import type { AppConfig } from '../../types';

const mockDataRaw = [
    { 'Data Alteração': '1/1/2023', 'Conta': 6401, 'Segmento': 'BMF', 'Produto': 'CCM', 'Assessor': 'DTVM SALES', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'SP100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 6401, 'Segmento': 'BMF', 'Produto': 'SJC', 'Assessor': 'DTVM SALES', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'SP100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 6401, 'Segmento': 'BMF', 'Produto': 'BGI', 'Assessor': 'DTVM SALES', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'SP100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 6951, 'Segmento': 'BMF', 'Produto': 'CCM', 'Assessor': 'DTVM SALES', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'SP100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20066, 'Segmento': 'BMF', 'Produto': 'CCM', 'Assessor': 'Grains I', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'KC835', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20069, 'Segmento': 'BMF', 'Produto': 'BGI', 'Assessor': 'Cattle', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'BZ130', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20070, 'Segmento': 'BMF', 'Produto': 'BGI', 'Assessor': 'Cattle', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'BZ130', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20071, 'Segmento': 'BMF', 'Produto': 'CCM', 'Assessor': 'Grains I', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'KC835', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20076, 'Segmento': 'BMF', 'Produto': 'DR1', 'Assessor': 'Cattle', 'Proporção (0-1)': '20%', 'Assessor Sinacor': 'BZ130', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20076, 'Segmento': 'BMF', 'Produto': 'DR1', 'Assessor': 'PNP-1 SP Desk', 'Proporção (0-1)': '80%', 'Assessor Sinacor': 'PNP - 1', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20076, 'Segmento': 'BMF', 'Produto': 'EUR', 'Assessor': 'Cattle', 'Proporção (0-1)': '20%', 'Assessor Sinacor': 'BZ130', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20076, 'Segmento': 'BMF', 'Produto': 'EUR', 'Assessor': 'PNP-1 SP Desk', 'Proporção (0-1)': '80%', 'Assessor Sinacor': 'PNP - 1', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20076, 'Segmento': 'BMF', 'Produto': 'IDI', 'Assessor': 'Cattle', 'Proporção (0-1)': '20%', 'Assessor Sinacor': 'BZ130', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20076, 'Segmento': 'BMF', 'Produto': 'IDI', 'Assessor': 'PNP-1 SP Desk', 'Proporção (0-1)': '80%', 'Assessor Sinacor': 'PNP - 1', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20076, 'Segmento': 'BMF', 'Produto': 'IR1', 'Assessor': 'Cattle', 'Proporção (0-1)': '20%', 'Assessor Sinacor': 'BZ130', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20076, 'Segmento': 'BMF', 'Produto': 'IR1', 'Assessor': 'PNP-1 SP Desk', 'Proporção (0-1)': '80%', 'Assessor Sinacor': 'PNP - 1', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20076, 'Segmento': 'BMF', 'Produto': 'DOL', 'Assessor': 'Cattle', 'Proporção (0-1)': '20%', 'Assessor Sinacor': 'BZ130', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20076, 'Segmento': 'BMF', 'Produto': 'DOL', 'Assessor': 'PNP-1 SP Desk', 'Proporção (0-1)': '80%', 'Assessor Sinacor': 'PNP - 1', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20096, 'Segmento': 'BMF', 'Produto': 'BGI', 'Assessor': 'Cattle', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'BZ130', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20099, 'Segmento': 'BMF', 'Produto': 'CCM', 'Assessor': 'Grains II', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'KC828', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20108, 'Segmento': 'BMF', 'Produto': 'BGI', 'Assessor': 'Cattle', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'BZ130', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20131, 'Segmento': 'BMF', 'Produto': 'CCM', 'Assessor': 'Grains I', 'Proporção (0-1)': '50%', 'Assessor Sinacor': 'KC835', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20131, 'Segmento': 'BMF', 'Produto': 'CCM', 'Assessor': 'Cattle', 'Proporção (0-1)': '50%', 'Assessor Sinacor': 'BZ130', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20133, 'Segmento': 'BMF', 'Produto': 'BGI', 'Assessor': 'Cattle', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'BZ130', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20197, 'Segmento': 'BMF', 'Produto': 'BGI', 'Assessor': 'Cattle', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'BZ130', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20198, 'Segmento': 'BMF', 'Produto': 'BGI', 'Assessor': 'Cattle', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'BZ130', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20232, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '70%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20232, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Sugar II', 'Proporção (0-1)': '30%', 'Assessor Sinacor': 'BZ183', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20233, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '70%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20233, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Sugar II', 'Proporção (0-1)': '30%', 'Assessor Sinacor': 'BZ183', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20234, 'Segmento': 'BMF', 'Produto': 'ETH', 'Assessor': 'Sugar II', 'Proporção (0-1)': '50%', 'Assessor Sinacor': 'BZ183', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20234, 'Segmento': 'BMF', 'Produto': 'ETH', 'Assessor': 'PGR', 'Proporção (0-1)': '50%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20235, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Sugar II', 'Proporção (0-1)': '30%', 'Assessor Sinacor': 'BZ183', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20235, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '70%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20239, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '50%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20239, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Sugar II', 'Proporção (0-1)': '50%', 'Assessor Sinacor': 'BZ100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20239, 'Segmento': 'BMF', 'Produto': 'ETH', 'Assessor': 'PGR', 'Proporção (0-1)': '50%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20239, 'Segmento': 'BMF', 'Produto': 'ETH', 'Assessor': 'Sugar II', 'Proporção (0-1)': '50%', 'Assessor Sinacor': 'BZ100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20241, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '70%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20241, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Sugar II', 'Proporção (0-1)': '30%', 'Assessor Sinacor': 'BZ100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20244, 'Segmento': 'BMF', 'Produto': 'BGI', 'Assessor': 'Grains II', 'Proporção (0-1)': '50%', 'Assessor Sinacor': 'KC828', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20244, 'Segmento': 'BMF', 'Produto': 'BGI', 'Assessor': 'Cattle', 'Proporção (0-1)': '50%', 'Assessor Sinacor': 'BZ130', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20247, 'Segmento': 'BMF', 'Produto': 'ETH', 'Assessor': 'Sugar II', 'Proporção (0-1)': '50%', 'Assessor Sinacor': 'BZ100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20247, 'Segmento': 'BMF', 'Produto': 'ETH', 'Assessor': 'PGR', 'Proporção (0-1)': '50%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20249, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '70%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20249, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Sugar II', 'Proporção (0-1)': '30%', 'Assessor Sinacor': 'BZ100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20252, 'Segmento': 'BMF', 'Produto': 'ETH', 'Assessor': 'Sugar II', 'Proporção (0-1)': '50%', 'Assessor Sinacor': 'BZ100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20252, 'Segmento': 'BMF', 'Produto': 'ETH', 'Assessor': 'PGR', 'Proporção (0-1)': '50%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20254, 'Segmento': 'BMF', 'Produto': 'BGI', 'Assessor': 'Cattle', 'Proporção (0-1)': '75%', 'Assessor Sinacor': 'BZ130', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20254, 'Segmento': 'BMF', 'Produto': 'BGI', 'Assessor': 'COFFEE', 'Proporção (0-1)': '25%', 'Assessor Sinacor': 'BZ164', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20255, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '70%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20255, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Sugar II', 'Proporção (0-1)': '30%', 'Assessor Sinacor': 'BZ100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20268, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Sugar II', 'Proporção (0-1)': '30%', 'Assessor Sinacor': 'BZ100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20268, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '70%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20268, 'Segmento': 'BMF', 'Produto': 'ETH', 'Assessor': 'Sugar II', 'Proporção (0-1)': '30%', 'Assessor Sinacor': 'BZ100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20268, 'Segmento': 'BMF', 'Produto': 'ETH', 'Assessor': 'PGR', 'Proporção (0-1)': '70%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20275, 'Segmento': 'BMF', 'Produto': 'ETH', 'Assessor': 'Sugar II', 'Proporção (0-1)': '30%', 'Assessor Sinacor': 'BZ100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20275, 'Segmento': 'BMF', 'Produto': 'ETH', 'Assessor': 'PGR', 'Proporção (0-1)': '70%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20275, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Sugar II', 'Proporção (0-1)': '30%', 'Assessor Sinacor': 'BZ100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20275, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '70%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20292, 'Segmento': 'BMF', 'Produto': 'ETH', 'Assessor': 'Sugar II', 'Proporção (0-1)': '30%', 'Assessor Sinacor': 'BZ100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20292, 'Segmento': 'BMF', 'Produto': 'ETH', 'Assessor': 'PGR', 'Proporção (0-1)': '70%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20292, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Sugar II', 'Proporção (0-1)': '50%', 'Assessor Sinacor': 'BZ100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20292, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '50%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20295, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20319, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Sugar II', 'Proporção (0-1)': '30%', 'Assessor Sinacor': 'BZ100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20319, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '70%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20339, 'Segmento': 'BMF', 'Produto': 'BGI', 'Assessor': 'Cattle', 'Proporção (0-1)': '20%', 'Assessor Sinacor': 'BZ130', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20339, 'Segmento': 'BMF', 'Produto': 'BGI', 'Assessor': 'Grains II', 'Proporção (0-1)': '80%', 'Assessor Sinacor': 'BZ192', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20339, 'Segmento': 'BMF', 'Produto': 'CCM', 'Assessor': 'Cattle', 'Proporção (0-1)': '20%', 'Assessor Sinacor': 'BZ130', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20339, 'Segmento': 'BMF', 'Produto': 'CCM', 'Assessor': 'Grains II', 'Proporção (0-1)': '80%', 'Assessor Sinacor': 'BZ192', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20339, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Cattle', 'Proporção (0-1)': '20%', 'Assessor Sinacor': 'BZ130', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20339, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Grains II', 'Proporção (0-1)': '80%', 'Assessor Sinacor': 'BZ192', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20351, 'Segmento': 'BMF', 'Produto': 'BGI', 'Assessor': 'Cattle', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'BZ130', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20352, 'Segmento': 'BMF', 'Produto': 'CCM', 'Assessor': 'Grains II', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'KC828', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20400, 'Segmento': 'Renda Fixa', 'Produto': 'Corretagem', 'Assessor': 'DCM', 'Proporção (0-1)': '85%', 'Assessor Sinacor': 'DCM', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20400, 'Segmento': 'Renda Fixa', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '15%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20405, 'Segmento': 'Renda Fixa', 'Produto': 'Corretagem', 'Assessor': 'DCM', 'Proporção (0-1)': '80%', 'Assessor Sinacor': 'DCM', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20405, 'Segmento': 'Renda Fixa', 'Produto': 'Corretagem', 'Assessor': 'Sugar I', 'Proporção (0-1)': '20%', 'Assessor Sinacor': 'KC830', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/1/2023', 'Conta': 20406, 'Segmento': 'BMF', 'Produto': 'BGI', 'Assessor': 'Cattle', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'BZ130', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/10/2023', 'Conta': 20232, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/10/2023', 'Conta': 20232, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Sugar II', 'Proporção (0-1)': '0%', 'Assessor Sinacor': 'BZ183', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/10/2023', 'Conta': 20233, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/10/2023', 'Conta': 20233, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Sugar II', 'Proporção (0-1)': '0%', 'Assessor Sinacor': 'BZ183', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/10/2023', 'Conta': 20235, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/10/2023', 'Conta': 20235, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Sugar II', 'Proporção (0-1)': '0%', 'Assessor Sinacor': 'BZ183', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/10/2023', 'Conta': 20241, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/10/2023', 'Conta': 20241, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Sugar II', 'Proporção (0-1)': '0%', 'Assessor Sinacor': 'BZ100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/10/2023', 'Conta': 20249, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/10/2023', 'Conta': 20249, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Sugar II', 'Proporção (0-1)': '0%', 'Assessor Sinacor': 'BZ100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/10/2023', 'Conta': 20255, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/10/2023', 'Conta': 20255, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Sugar II', 'Proporção (0-1)': '0%', 'Assessor Sinacor': 'BZ100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/10/2023', 'Conta': 20268, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/10/2023', 'Conta': 20268, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Sugar II', 'Proporção (0-1)': '0%', 'Assessor Sinacor': 'BZ100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/10/2023', 'Conta': 20275, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/10/2023', 'Conta': 20275, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Sugar II', 'Proporção (0-1)': '0%', 'Assessor Sinacor': 'BZ100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/10/2023', 'Conta': 20292, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/10/2023', 'Conta': 20292, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Sugar II', 'Proporção (0-1)': '0%', 'Assessor Sinacor': 'BZ100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/10/2023', 'Conta': 20319, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'PGR', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'BZ104', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '1/10/2023', 'Conta': 20319, 'Segmento': 'Cbios', 'Produto': 'Corretagem', 'Assessor': 'Sugar II', 'Proporção (0-1)': '0%', 'Assessor Sinacor': 'BZ100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '22/05/2025', 'Conta': 7046, 'Segmento': 'BMF', 'Produto': 'CCM', 'Assessor': 'DTVM SALES', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'SP100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '22/05/2025', 'Conta': 7046, 'Segmento': 'BMF', 'Produto': 'BGI', 'Assessor': 'DTVM SALES', 'Proporção (0-1)': '100%', 'Assessor Sinacor': 'SP100', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '27/06/2025', 'Conta': 20614, 'Segmento': 'Renda Fixa', 'Produto': 'Corretagem', 'Assessor': 'DCM', 'Proporção (0-1)': '85%', 'Assessor Sinacor': 'DCM', 'Segmento_Cliente': 'Commodities Business' },
    { 'Data Alteração': '27/06/2025', 'Conta': 20614, 'Segmento': 'Renda Fixa', 'Produto': 'Corretagem', 'Assessor': 'CATTLE', 'Proporção (0-1)': '15%', 'Assessor Sinacor': 'BZ130', 'Segmento_Cliente': 'Commodities Business' },
];

const mockData = mockDataRaw.map(item => ({
    data_alteracao: item['Data Alteração'],
    conta: item['Conta'],
    segmento: item['Segmento'],
    produto: item['Produto'],
    assessor: item['Assessor'],
    proporcao: item['Proporção (0-1)'],
    assessor_sinacor: item['Assessor Sinacor'],
    segmento_cliente: item['Segmento_Cliente'],
    uuid: crypto.randomUUID()
}));

export const getSplitExcecaoProdutoData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockData);
        }, 300);
    });
};

export const splitExcecaoProdutoDashboardConfig: AppConfig = {
    name: "split_excecao_produto_dashboard",
    version: "1.0.0",
    datasources: [
        {
            name: "split_excecao_produto",
            description: "Dados da SPLIT Exceção Produto",
            enableInlineEditing: true,
        }
    ],
    dashboard: {
        title: "4. SPLIT Exceção Produto",
        widgets: [
            {
                id: 'split-excecao-produto-description',
                type: 'markdown',
                dataSource: '',
                title: 'Descrição',
                description: '',
                gridWidth: 12,
                gridHeight: 2,
                transparentBackground: true,
                content: `
# Regras de Negócio - SPLIT Exceção Produto

Esta tabela exibe as regras para a SPLIT Exceção Produto. Os dados podem ser modificados diretamente na tabela abaixo.

- **Para adicionar uma linha**: Passe o mouse sobre a linha e clique no ícone (+) que aparece à esquerda.
- **Para editar uma célula**: Dê um duplo clique na célula desejada.
- **Para salvar**: Pressione Enter ou clique fora da célula.
- **Para cancelar**: Pressione Escape.
- A tabela suporta ordenação e filtragem por coluna para facilitar a análise.
                `
            },
            {
                id: 'split-excecao-produto-table',
                type: 'datatable',
                dataSource: 'split_excecao_produto',
                title: 'Dados da SPLIT Exceção Produto',
                description: 'Clique duas vezes para editar. Use a pesquisa global e os filtros de coluna para encontrar dados.',
                gridWidth: 12,
                gridHeight: 8,
                rowKeyColumn: 'uuid',
                pageSize: 15,
                enableGlobalSearch: true,
                enableInlineEditing: true,
                enableRowCreation: true,
                columns: [
                    { key: 'data_alteracao', header: 'Data Alteração', enableSorting: true, enableFiltering: true, enableEditing: true },
                    { key: 'conta', header: 'Conta', enableSorting: true, enableFiltering: true, enableEditing: true },
                    { key: 'segmento', header: 'Segmento', enableSorting: true, enableFiltering: true, enableEditing: true },
                    { key: 'produto', header: 'Produto', enableSorting: true, enableFiltering: true, enableEditing: true },
                    { key: 'assessor', header: 'Assessor', enableSorting: true, enableFiltering: true, enableEditing: true },
                    { key: 'proporcao', header: 'Proporção (0-1)', enableSorting: true, enableFiltering: true, enableEditing: true },
                    { key: 'assessor_sinacor', header: 'Assessor Sinacor', enableSorting: true, enableFiltering: true, enableEditing: true },
                    { key: 'segmento_cliente', header: 'Segmento_Cliente', enableSorting: true, enableFiltering: true, enableEditing: true },
                ]
            }
        ]
    }
};
