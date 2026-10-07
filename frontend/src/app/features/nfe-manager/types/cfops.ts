export interface Cfop {
  code: string;
  natOp: string;
}

export const CFOPS: Cfop[] = [
  {
    code: '1101',
    natOp: 'Compra para industrialização ou produção rural',
  },
  {
    code: '1102',
    natOp: 'Compra para comercialização',
  },
  {
    code: '1111',
    natOp: 'Compra para industrialização de mercadoria recebida em transferência',
  },
  {
    code: '1113',
    natOp: 'Compra para comercialização de mercadoria recebida em transferência',
  },
  {
    code: '1116',
    natOp: 'Compra para industrialização originada de encomenda para entrega futura',
  },
  {
    code: '1117',
    natOp: 'Compra para comercialização originada de encomenda para entrega futura',
  },
  {
    code: '1118',
    natOp:
      'Compra de mercadoria para comercialização pelo adquirente originário, entregue pelo vendedor remetente ao destinatário',
  },
  {
    code: '1120',
    natOp: 'Compra para industrialização, em venda à ordem, já recebida do vendedor remetente',
  },
  {
    code: '1121',
    natOp: 'Compra para comercialização, em venda à ordem, já recebida do vendedor remetente',
  },
  {
    code: '1122',
    natOp:
      'Compra para industrialização em que a mercadoria foi remetida pelo fornecedor ao industrializador sem transitar pelo estabelecimento do adquirente',
  },
  {
    code: '1124',
    natOp: 'Industrialização efetuada por outra empresa',
  },
  {
    code: '1125',
    natOp:
      'Industrialização efetuada por outra empresa quando a mercadoria remetida para industrialização não transitar pelo estabelecimento do adquirente',
  },
  {
    code: '1126',
    natOp: 'Compra de mercadoria para utilização na prestação de serviço sujeita ao ISSQN',
  },
  {
    code: '1128',
    natOp: 'Compra para utilização na prestação de serviço sujeita ao ISSQN',
  },
  {
    code: '1151',
    natOp: 'Transferência para industrialização ou produção rural',
  },
  {
    code: '1152',
    natOp: 'Transferência para comercialização',
  },
  {
    code: '1153',
    natOp: 'Transferência de energia elétrica para distribuição',
  },
  {
    code: '1154',
    natOp: 'Transferência para utilização na prestação de serviço',
  },
  {
    code: '1201',
    natOp: 'Devolução de venda de produção do estabelecimento',
  },
  {
    code: '1202',
    natOp: 'Devolução de venda de mercadoria adquirida ou recebida de terceiros',
  },
  {
    code: '1203',
    natOp:
      'Devolução de venda de produção do estabelecimento, destinada à Zona Franca de Manaus ou Áreas de Livre Comércio',
  },
  {
    code: '1204',
    natOp:
      'Devolução de venda de mercadoria adquirida ou recebida de terceiros, destinada à Zona Franca de Manaus ou Áreas de Livre Comércio',
  },
  {
    code: '1205',
    natOp: 'Anulação de valor relativo à prestação de serviço de comunicação',
  },
  {
    code: '1206',
    natOp: 'Anulação de valor relativo à prestação de serviço de transporte',
  },
  {
    code: '1207',
    natOp: 'Anulação de valor relativo à venda de energia elétrica',
  },
  {
    code: '1208',
    natOp: 'Devolução de produção do estabelecimento, remetida em transferência',
  },
  {
    code: '1209',
    natOp: 'Devolução de mercadoria adquirida ou recebida de terceiros, remetida em transferência',
  },
  {
    code: '1251',
    natOp: 'Compra de energia elétrica para distribuição ou comercialização',
  },
  {
    code: '1252',
    natOp: 'Compra de energia elétrica por estabelecimento industrial',
  },
  {
    code: '1253',
    natOp: 'Compra de energia elétrica por estabelecimento comercial',
  },
  {
    code: '1254',
    natOp: 'Compra de energia elétrica por estabelecimento prestador de serviço de transporte',
  },
  {
    code: '1255',
    natOp: 'Compra de energia elétrica por estabelecimento prestador de serviço de comunicação',
  },
  {
    code: '1256',
    natOp: 'Compra de energia elétrica por estabelecimento de produtor rural',
  },
  {
    code: '1257',
    natOp: 'Compra de energia elétrica para consumo por demanda contratada',
  },
  {
    code: '1301',
    natOp: 'Aquisição de serviço de comunicação para execução de serviço da mesma natureza',
  },
  {
    code: '1302',
    natOp: 'Aquisição de serviço de comunicação por estabelecimento industrial',
  },
  {
    code: '1303',
    natOp: 'Aquisição de serviço de comunicação por estabelecimento comercial',
  },
  {
    code: '1304',
    natOp:
      'Aquisição de serviço de comunicação por estabelecimento de prestador de serviço de transporte',
  },
  {
    code: '1305',
    natOp:
      'Aquisição de serviço de comunicação por estabelecimento gerador, transmissor ou distribuidor de energia elétrica',
  },
  {
    code: '1306',
    natOp: 'Aquisição de serviço de comunicação por estabelecimento de produtor rural',
  },
  {
    code: '1351',
    natOp: 'Aquisição de serviço de transporte por estabelecimento industrial',
  },
  {
    code: '1352',
    natOp: 'Aquisição de serviço de transporte por estabelecimento comercial',
  },
  {
    code: '1353',
    natOp:
      'Aquisição de serviço de transporte por estabelecimento gerador, transmissor ou distribuidor de energia elétrica',
  },
  {
    code: '1354',
    natOp:
      'Aquisição de serviço de transporte por estabelecimento prestador de serviço de comunicação',
  },
  {
    code: '1355',
    natOp: 'Aquisição de serviço de transporte por estabelecimento de produtor rural',
  },
  {
    code: '1356',
    natOp:
      'Aquisição de serviço de transporte por estabelecimento de prestador de serviço de transporte',
  },
  {
    code: '1401',
    natOp:
      'Compra para industrialização ou produção rural em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '1403',
    natOp:
      'Compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '1406',
    natOp:
      'Compra de bem para o ativo imobilizado cuja entrada esteja sujeita ao regime de substituição tributária',
  },
  {
    code: '1407',
    natOp:
      'Compra de mercadoria para uso ou consumo cuja entrada esteja sujeita ao regime de substituição tributária',
  },
  {
    code: '1408',
    natOp:
      'Transferência para industrialização ou produção rural em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '1409',
    natOp:
      'Transferência para comercialização em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '1410',
    natOp:
      'Devolução de venda de produção do estabelecimento em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '1411',
    natOp:
      'Devolução de venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '1414',
    natOp:
      'Retorno de produção do estabelecimento remetida para venda fora do estabelecimento em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '1415',
    natOp:
      'Retorno de mercadoria adquirida ou recebida de terceiros remetida para venda fora do estabelecimento em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '1451',
    natOp: 'Retorno de animal do estabelecimento produtor',
  },
  {
    code: '1452',
    natOp: 'Retorno de insumo não utilizado na produção',
  },
  {
    code: '1501',
    natOp: 'Entrada de mercadoria recebida com fim específico de exportação',
  },
  {
    code: '1503',
    natOp:
      'Entrada decorrente de devolução de produto remetido com fim específico de exportação, produzido pelo estabelecimento',
  },
  {
    code: '1504',
    natOp:
      'Entrada decorrente de devolução de mercadoria remetida com fim específico de exportação, adquirida ou recebida de terceiros',
  },
  {
    code: '1505',
    natOp:
      'Entrada decorrente de devolução de mercadoria remetida para formação de lote de exportação, adquirida ou recebida de terceiros',
  },
  {
    code: '1506',
    natOp:
      'Entrada decorrente de devolução de produto remetido para formação de lote de exportação, produzido pelo estabelecimento',
  },
  {
    code: '1551',
    natOp: 'Compra de bem para o ativo imobilizado',
  },
  {
    code: '1552',
    natOp: 'Transferência de bem do ativo imobilizado',
  },
  {
    code: '1553',
    natOp: 'Devolução de venda de bem do ativo imobilizado',
  },
  {
    code: '1554',
    natOp: 'Retorno de bem do ativo imobilizado remetido para uso fora do estabelecimento',
  },
  {
    code: '1555',
    natOp: 'Entrada de bem do ativo imobilizado remetido para uso fora do estabelecimento',
  },
  {
    code: '1556',
    natOp: 'Compra de material para uso ou consumo',
  },
  {
    code: '1557',
    natOp: 'Transferência de material para uso ou consumo',
  },
  {
    code: '1601',
    natOp: 'Recebimento, por transferência, de crédito de ICMS',
  },
  {
    code: '1602',
    natOp:
      'Recebimento, por transferência, de saldo credor de ICMS de outro estabelecimento da mesma empresa, para compensação de saldo devedor de ICMS',
  },
  {
    code: '1603',
    natOp: 'Ressarcimento de ICMS retido por substituição tributária',
  },
  {
    code: '1604',
    natOp: 'Lançamento do crédito relativo à compra de bem para o ativo imobilizado',
  },
  {
    code: '1605',
    natOp:
      'Recebimento, por transferência, de saldo credor de ICMS de outra empresa para compensação de saldo devedor de ICMS',
  },
  {
    code: '1651',
    natOp: 'Compra de combustível ou lubrificante para industrialização subseqüente',
  },
  {
    code: '1652',
    natOp: 'Compra de combustível ou lubrificante para comercialização',
  },
  {
    code: '1653',
    natOp: 'Compra de combustível ou lubrificante por consumidor ou usuário final',
  },
  {
    code: '1658',
    natOp: 'Transferência de combustível ou lubrificante para industrialização',
  },
  {
    code: '1659',
    natOp: 'Transferência de combustível ou lubrificante para comercialização',
  },
  {
    code: '1660',
    natOp:
      'Devolução de venda de combustível ou lubrificante destinados à industrialização subseqüente',
  },
  {
    code: '1661',
    natOp: 'Devolução de venda de combustível ou lubrificante destinados à comercialização',
  },
  {
    code: '1662',
    natOp:
      'Devolução de venda de combustível ou lubrificante destinados a consumidor ou usuário final',
  },
  {
    code: '1901',
    natOp: 'Entrada para industrialização por encomenda',
  },
  {
    code: '1902',
    natOp: 'Retorno de mercadoria remetida para industrialização por encomenda',
  },
  {
    code: '1903',
    natOp:
      'Entrada de mercadoria remetida para industrialização e não aplicada no processo industrial',
  },
  {
    code: '1904',
    natOp: 'Retorno de remessa para venda fora do estabelecimento',
  },
  {
    code: '1905',
    natOp: 'Entrada de mercadoria recebida para depósito fechado ou armazém geral',
  },
  {
    code: '1906',
    natOp: 'Retorno de mercadoria remetida para depósito fechado ou armazém geral',
  },
  {
    code: '1907',
    natOp: 'Retorno de mercadoria remetida para depósito fechado ou armazém geral',
  },
  {
    code: '1908',
    natOp: 'Entrada de bem por empréstimo',
  },
  {
    code: '1909',
    natOp: 'Retorno de bem remetido por empréstimo',
  },
  {
    code: '1910',
    natOp: 'Entrada de mercadoria recebida para conserto ou reparo',
  },
  {
    code: '1911',
    natOp: 'Retorno de mercadoria remetida para conserto ou reparo',
  },
  {
    code: '1912',
    natOp: 'Entrada de mercadoria ou bem recebido para demonstração',
  },
  {
    code: '1913',
    natOp: 'Retorno de mercadoria ou bem remetido para demonstração',
  },
  {
    code: '1914',
    natOp: 'Retorno de mercadoria ou bem remetido para exposição ou feira',
  },
  {
    code: '1915',
    natOp: 'Entrada de mercadoria ou bem recebido para conserto ou reparo',
  },
  {
    code: '1916',
    natOp: 'Retorno de mercadoria ou bem remetido para conserto ou reparo',
  },
  {
    code: '1917',
    natOp: 'Entrada de mercadoria recebida em consignação mercantil ou industrial',
  },
  {
    code: '1918',
    natOp: 'Devolução de mercadoria remetida em consignação mercantil ou industrial',
  },
  {
    code: '1919',
    natOp: 'Devolução de mercadoria remetida em consignação dados em comodato',
  },
  {
    code: '1920',
    natOp: 'Entrada de vasilhame ou sacaria',
  },
  {
    code: '1921',
    natOp: 'Retorno de vasilhame ou sacaria',
  },
  {
    code: '1922',
    natOp:
      'Lançamento efetuado a título de simples faturamento decorrente de compra para entrega futura',
  },
  {
    code: '1923',
    natOp: 'Entrada de mercadoria recebida em doação',
  },
  {
    code: '1924',
    natOp:
      'Entrada para industrialização por conta e ordem do adquirente da mercadoria, quando esta não transitar pelo estabelecimento do adquirente',
  },
  {
    code: '1925',
    natOp:
      'Retorno de mercadoria remetida para industrialização por conta e ordem do adquirente da mercadoria, quando esta não transitar pelo estabelecimento do adquirente',
  },
  {
    code: '1926',
    natOp:
      'Lançamento efetuado a título de reclassificação de mercadoria decorrente de formação de kit ou de sua desestruturação',
  },
  {
    code: '1931',
    natOp:
      'Lançamento efetuado pelo tomador do serviço de transporte quando a responsabilidade pelo recolhimento do imposto for atribuída a terceiro',
  },
  {
    code: '1932',
    natOp:
      'Aquisição de serviço de transporte iniciado em UF diversa daquela onde inscrito o prestador',
  },
  {
    code: '1933',
    natOp: 'Aquisição de serviço tributado pelo ISSQN',
  },
  {
    code: '1934',
    natOp: 'Entrada de mercadoria recebida em bonificação, doação ou brinde',
  },
  {
    code: '1949',
    natOp: 'Outra entrada de mercadoria ou prestação de serviço não especificada',
  },
  {
    code: '2101',
    natOp: 'Compra para industrialização ou produção rural',
  },
  {
    code: '2102',
    natOp: 'Compra para comercialização',
  },
  {
    code: '2111',
    natOp: 'Compra para industrialização de mercadoria recebida em transferência',
  },
  {
    code: '2113',
    natOp: 'Compra para comercialização de mercadoria recebida em transferência',
  },
  {
    code: '2116',
    natOp: 'Compra para industrialização originada de encomenda para entrega futura',
  },
  {
    code: '2117',
    natOp: 'Compra para comercialização originada de encomenda para entrega futura',
  },
  {
    code: '2118',
    natOp:
      'Compra de mercadoria para comercialização pelo adquirente originário, entregue pelo vendedor remetente ao destinatário',
  },
  {
    code: '2120',
    natOp: 'Compra para industrialização, em venda à ordem, já recebida do vendedor remetente',
  },
  {
    code: '2121',
    natOp: 'Compra para comercialização, em venda à ordem, já recebida do vendedor remetente',
  },
  {
    code: '2122',
    natOp:
      'Compra para industrialização em que a mercadoria foi remetida pelo fornecedor ao industrializador sem transitar pelo estabelecimento do adquirente',
  },
  {
    code: '2124',
    natOp: 'Industrialização efetuada por outra empresa',
  },
  {
    code: '2125',
    natOp:
      'Industrialização efetuada por outra empresa quando a mercadoria remetida para industrialização não transitar pelo estabelecimento do adquirente',
  },
  {
    code: '2126',
    natOp: 'Compra de mercadoria para utilização na prestação de serviço sujeita ao ISSQN',
  },
  {
    code: '2128',
    natOp: 'Compra para utilização na prestação de serviço sujeita ao ISSQN',
  },
  {
    code: '2151',
    natOp: 'Transferência para industrialização ou produção rural',
  },
  {
    code: '2152',
    natOp: 'Transferência para comercialização',
  },
  {
    code: '2153',
    natOp: 'Transferência de energia elétrica para distribuição',
  },
  {
    code: '2154',
    natOp: 'Transferência para utilização na prestação de serviço',
  },
  {
    code: '2201',
    natOp: 'Devolução de venda de produção do estabelecimento',
  },
  {
    code: '2202',
    natOp: 'Devolução de venda de mercadoria adquirida ou recebida de terceiros',
  },
  {
    code: '2203',
    natOp:
      'Devolução de venda de produção do estabelecimento, destinada à Zona Franca de Manaus ou Áreas de Livre Comércio',
  },
  {
    code: '2204',
    natOp:
      'Devolução de venda de mercadoria adquirida ou recebida de terceiros, destinada à Zona Franca de Manaus ou Áreas de Livre Comércio',
  },
  {
    code: '2205',
    natOp: 'Anulação de valor relativo à prestação de serviço de comunicação',
  },
  {
    code: '2206',
    natOp: 'Anulação de valor relativo à prestação de serviço de transporte',
  },
  {
    code: '2207',
    natOp: 'Anulação de valor relativo à venda de energia elétrica',
  },
  {
    code: '2208',
    natOp: 'Devolução de produção do estabelecimento, remetida em transferência',
  },
  {
    code: '2209',
    natOp: 'Devolução de mercadoria adquirida ou recebida de terceiros, remetida em transferência',
  },
  {
    code: '2251',
    natOp: 'Compra de energia elétrica para distribuição ou comercialização',
  },
  {
    code: '2252',
    natOp: 'Compra de energia elétrica por estabelecimento industrial',
  },
  {
    code: '2253',
    natOp: 'Compra de energia elétrica por estabelecimento comercial',
  },
  {
    code: '2254',
    natOp: 'Compra de energia elétrica por estabelecimento prestador de serviço de transporte',
  },
  {
    code: '2255',
    natOp: 'Compra de energia elétrica por estabelecimento prestador de serviço de comunicação',
  },
  {
    code: '2256',
    natOp: 'Compra de energia elétrica por estabelecimento de produtor rural',
  },
  {
    code: '2257',
    natOp: 'Compra de energia elétrica para consumo por demanda contratada',
  },
  {
    code: '2301',
    natOp: 'Aquisição de serviço de comunicação para execução de serviço da mesma natureza',
  },
  {
    code: '2302',
    natOp: 'Aquisição de serviço de comunicação por estabelecimento industrial',
  },
  {
    code: '2303',
    natOp: 'Aquisição de serviço de comunicação por estabelecimento comercial',
  },
  {
    code: '2304',
    natOp:
      'Aquisição de serviço de comunicação por estabelecimento de prestador de serviço de transporte',
  },
  {
    code: '2305',
    natOp:
      'Aquisição de serviço de comunicação por estabelecimento gerador, transmissor ou distribuidor de energia elétrica',
  },
  {
    code: '2306',
    natOp: 'Aquisição de serviço de comunicação por estabelecimento de produtor rural',
  },
  {
    code: '2351',
    natOp: 'Aquisição de serviço de transporte por estabelecimento industrial',
  },
  {
    code: '2352',
    natOp: 'Aquisição de serviço de transporte por estabelecimento comercial',
  },
  {
    code: '2353',
    natOp:
      'Aquisição de serviço de transporte por estabelecimento gerador, transmissor ou distribuidor de energia elétrica',
  },
  {
    code: '2354',
    natOp:
      'Aquisição de serviço de transporte por estabelecimento prestador de serviço de comunicação',
  },
  {
    code: '2355',
    natOp: 'Aquisição de serviço de transporte por estabelecimento de produtor rural',
  },
  {
    code: '2356',
    natOp:
      'Aquisição de serviço de transporte por estabelecimento de prestador de serviço de transporte',
  },
  {
    code: '2401',
    natOp:
      'Compra para industrialização ou produção rural em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '2403',
    natOp:
      'Compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '2406',
    natOp:
      'Compra de bem para o ativo imobilizado cuja entrada esteja sujeita ao regime de substituição tributária',
  },
  {
    code: '2407',
    natOp:
      'Compra de mercadoria para uso ou consumo cuja entrada esteja sujeita ao regime de substituição tributária',
  },
  {
    code: '2408',
    natOp:
      'Transferência para industrialização ou produção rural em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '2409',
    natOp:
      'Transferência para comercialização em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '2410',
    natOp:
      'Devolução de venda de produção do estabelecimento em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '2411',
    natOp:
      'Devolução de venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '2414',
    natOp:
      'Retorno de produção do estabelecimento remetida para venda fora do estabelecimento em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '2415',
    natOp:
      'Retorno de mercadoria adquirida ou recebida de terceiros remetida para venda fora do estabelecimento em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '2501',
    natOp: 'Entrada de mercadoria recebida com fim específico de exportação',
  },
  {
    code: '2503',
    natOp:
      'Entrada decorrente de devolução de produto remetido com fim específico de exportação, produzido pelo estabelecimento',
  },
  {
    code: '2504',
    natOp:
      'Entrada decorrente de devolução de mercadoria remetida com fim específico de exportação, adquirida ou recebida de terceiros',
  },
  {
    code: '2505',
    natOp:
      'Entrada decorrente de devolução de mercadoria remetida para formação de lote de exportação, adquirida ou recebida de terceiros',
  },
  {
    code: '2506',
    natOp:
      'Entrada decorrente de devolução de produto remetido para formação de lote de exportação, produzido pelo estabelecimento',
  },
  {
    code: '2551',
    natOp: 'Compra de bem para o ativo imobilizado',
  },
  {
    code: '2552',
    natOp: 'Transferência de bem do ativo imobilizado',
  },
  {
    code: '2553',
    natOp: 'Devolução de venda de bem do ativo imobilizado',
  },
  {
    code: '2554',
    natOp: 'Retorno de bem do ativo imobilizado remetido para uso fora do estabelecimento',
  },
  {
    code: '2555',
    natOp: 'Entrada de bem do ativo imobilizado remetido para uso fora do estabelecimento',
  },
  {
    code: '2556',
    natOp: 'Compra de material para uso ou consumo',
  },
  {
    code: '2557',
    natOp: 'Transferência de material para uso ou consumo',
  },
  {
    code: '2601',
    natOp: 'Recebimento, por transferência, de crédito de ICMS',
  },
  {
    code: '2602',
    natOp:
      'Recebimento, por transferência, de saldo credor de ICMS de outro estabelecimento da mesma empresa, para compensação de saldo devedor de ICMS',
  },
  {
    code: '2603',
    natOp: 'Ressarcimento de ICMS retido por substituição tributária',
  },
  {
    code: '2651',
    natOp: 'Compra de combustível ou lubrificante para industrialização subseqüente',
  },
  {
    code: '2652',
    natOp: 'Compra de combustível ou lubrificante para comercialização',
  },
  {
    code: '2653',
    natOp: 'Compra de combustível ou lubrificante por consumidor ou usuário final',
  },
  {
    code: '2658',
    natOp: 'Transferência de combustível ou lubrificante para industrialização',
  },
  {
    code: '2659',
    natOp: 'Transferência de combustível ou lubrificante para comercialização',
  },
  {
    code: '2660',
    natOp:
      'Devolução de venda de combustível ou lubrificante destinados à industrialização subseqüente',
  },
  {
    code: '2661',
    natOp: 'Devolução de venda de combustível ou lubrificante destinados à comercialização',
  },
  {
    code: '2662',
    natOp:
      'Devolução de venda de combustível ou lubrificante destinados a consumidor ou usuário final',
  },
  {
    code: '2901',
    natOp: 'Entrada para industrialização por encomenda',
  },
  {
    code: '2902',
    natOp: 'Retorno de mercadoria remetida para industrialização por encomenda',
  },
  {
    code: '2903',
    natOp:
      'Entrada de mercadoria remetida para industrialização e não aplicada no processo industrial',
  },
  {
    code: '2904',
    natOp: 'Retorno de remessa para venda fora do estabelecimento',
  },
  {
    code: '2905',
    natOp: 'Entrada de mercadoria recebida para depósito fechado ou armazém geral',
  },
  {
    code: '2906',
    natOp: 'Retorno de mercadoria remetida para depósito fechado ou armazém geral',
  },
  {
    code: '2907',
    natOp: 'Retorno de mercadoria remetida para depósito fechado ou armazém geral',
  },
  {
    code: '2908',
    natOp: 'Entrada de bem por empréstimo',
  },
  {
    code: '2909',
    natOp: 'Retorno de bem remetido por empréstimo',
  },
  {
    code: '2910',
    natOp: 'Entrada de mercadoria recebida para conserto ou reparo',
  },
  {
    code: '2911',
    natOp: 'Retorno de mercadoria remetida para conserto ou reparo',
  },
  {
    code: '2912',
    natOp: 'Entrada de mercadoria ou bem recebido para demonstração',
  },
  {
    code: '2913',
    natOp: 'Retorno de mercadoria ou bem remetido para demonstração',
  },
  {
    code: '2914',
    natOp: 'Retorno de mercadoria ou bem remetido para exposição ou feira',
  },
  {
    code: '2915',
    natOp: 'Entrada de mercadoria ou bem recebido para conserto ou reparo',
  },
  {
    code: '2916',
    natOp: 'Retorno de mercadoria ou bem remetido para conserto ou reparo',
  },
  {
    code: '2917',
    natOp: 'Entrada de mercadoria recebida em consignação mercantil ou industrial',
  },
  {
    code: '2918',
    natOp: 'Devolução de mercadoria remetida em consignação mercantil ou industrial',
  },
  {
    code: '2919',
    natOp: 'Devolução de mercadoria remetida em consignação dados em comodato',
  },
  {
    code: '2920',
    natOp: 'Entrada de vasilhame ou sacaria',
  },
  {
    code: '2921',
    natOp: 'Retorno de vasilhame ou sacaria',
  },
  {
    code: '2922',
    natOp:
      'Lançamento efetuado a título de simples faturamento decorrente de compra para entrega futura',
  },
  {
    code: '2923',
    natOp: 'Entrada de mercadoria recebida em doação',
  },
  {
    code: '2924',
    natOp:
      'Entrada para industrialização por conta e ordem do adquirente da mercadoria, quando esta não transitar pelo estabelecimento do adquirente',
  },
  {
    code: '2925',
    natOp:
      'Retorno de mercadoria remetida para industrialização por conta e ordem do adquirente da mercadoria, quando esta não transitar pelo estabelecimento do adquirente',
  },
  {
    code: '2931',
    natOp:
      'Lançamento efetuado pelo tomador do serviço de transporte quando a responsabilidade pelo recolhimento do imposto for atribuída a terceiro',
  },
  {
    code: '2932',
    natOp:
      'Aquisição de serviço de transporte iniciado em UF diversa daquela onde inscrito o prestador',
  },
  {
    code: '2933',
    natOp: 'Aquisição de serviço tributado pelo ISSQN',
  },
  {
    code: '2934',
    natOp: 'Entrada de mercadoria recebida em bonificação, doação ou brinde',
  },
  {
    code: '2949',
    natOp: 'Outra entrada de mercadoria ou prestação de serviço não especificada',
  },
  {
    code: '5101',
    natOp: 'Venda de produção do estabelecimento',
  },
  {
    code: '5102',
    natOp: 'Venda de mercadoria adquirida ou recebida de terceiros',
  },
  {
    code: '5103',
    natOp: 'Venda de produção do estabelecimento, efetuada fora do estabelecimento',
  },
  {
    code: '5104',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros, efetuada fora do estabelecimento',
  },
  {
    code: '5105',
    natOp:
      'Venda de produção do estabelecimento que não deva transitar pelo estabelecimento do vendedor',
  },
  {
    code: '5106',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros, que não deva transitar pelo estabelecimento do vendedor',
  },
  {
    code: '5109',
    natOp:
      'Venda de produção do estabelecimento destinada à Zona Franca de Manaus ou Áreas de Livre Comércio',
  },
  {
    code: '5110',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros, destinada à Zona Franca de Manaus ou Áreas de Livre Comércio',
  },
  {
    code: '5111',
    natOp: 'Venda de produção do estabelecimento remetida anteriormente em consignação industrial',
  },
  {
    code: '5112',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros remetida anteriormente em consignação industrial',
  },
  {
    code: '5113',
    natOp: 'Venda de produção do estabelecimento remetida anteriormente em consignação mercantil',
  },
  {
    code: '5114',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros remetida anteriormente em consignação mercantil',
  },
  {
    code: '5115',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros, recebida anteriormente em consignação mercantil',
  },
  {
    code: '5116',
    natOp: 'Venda de produção do estabelecimento originada de encomenda para entrega futura',
  },
  {
    code: '5117',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros, originada de encomenda para entrega futura',
  },
  {
    code: '5118',
    natOp:
      'Venda de produção do estabelecimento entregue ao destinatário por conta e ordem do adquirente originário, em venda à ordem',
  },
  {
    code: '5119',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros entregue ao destinatário por conta e ordem do adquirente originário, em venda à ordem',
  },
  {
    code: '5120',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros entregue ao destinatário pelo vendedor remetente, em venda à ordem',
  },
  {
    code: '5122',
    natOp:
      'Venda de produção do estabelecimento remetida para industrialização, por conta e ordem do adquirente, sem transitar pelo estabelecimento do adquirente',
  },
  {
    code: '5123',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros remetida para industrialização, por conta e ordem do adquirente, sem transitar pelo estabelecimento do adquirente',
  },
  {
    code: '5124',
    natOp: 'Industrialização efetuada para outra empresa',
  },
  {
    code: '5125',
    natOp:
      'Industrialização efetuada para outra empresa quando a mercadoria recebida para industrialização não transitar pelo estabelecimento do adquirente',
  },
  {
    code: '5151',
    natOp: 'Transferência de produção do estabelecimento',
  },
  {
    code: '5152',
    natOp: 'Transferência de mercadoria adquirida ou recebida de terceiros',
  },
  {
    code: '5153',
    natOp: 'Transferência de energia elétrica',
  },
  {
    code: '5155',
    natOp:
      'Transferência de produção do estabelecimento que não deva transitar pelo estabelecimento do remetente',
  },
  {
    code: '5156',
    natOp:
      'Transferência de mercadoria adquirida ou recebida de terceiros que não deva transitar pelo estabelecimento do remetente',
  },
  {
    code: '5201',
    natOp: 'Devolução de compra para industrialização ou produção rural',
  },
  {
    code: '5202',
    natOp: 'Devolução de compra para comercialização',
  },
  {
    code: '5205',
    natOp: 'Anulação de valor relativo a serviço de comunicação',
  },
  {
    code: '5206',
    natOp: 'Anulação de valor relativo a serviço de transporte',
  },
  {
    code: '5207',
    natOp: 'Anulação de valor relativo ao fornecimento de energia elétrica',
  },
  {
    code: '5208',
    natOp:
      'Devolução de mercadoria recebida em transferência para industrialização ou produção rural',
  },
  {
    code: '5209',
    natOp: 'Devolução de mercadoria recebida em transferência para comercialização',
  },
  {
    code: '5210',
    natOp: 'Devolução de compra para utilização na prestação de serviço',
  },
  {
    code: '5251',
    natOp: 'Venda de energia elétrica para distribuição ou comercialização',
  },
  {
    code: '5252',
    natOp: 'Venda de energia elétrica para estabelecimento industrial',
  },
  {
    code: '5253',
    natOp: 'Venda de energia elétrica para estabelecimento comercial',
  },
  {
    code: '5254',
    natOp: 'Venda de energia elétrica para estabelecimento prestador de serviço de transporte',
  },
  {
    code: '5255',
    natOp: 'Venda de energia elétrica para estabelecimento prestador de serviço de comunicação',
  },
  {
    code: '5256',
    natOp: 'Venda de energia elétrica para estabelecimento de produtor rural',
  },
  {
    code: '5257',
    natOp: 'Venda de energia elétrica para consumo por demanda contratada',
  },
  {
    code: '5258',
    natOp: 'Venda de energia elétrica a não contribuinte',
  },
  {
    code: '5301',
    natOp: 'Prestação de serviço de comunicação para execução de serviço da mesma natureza',
  },
  {
    code: '5302',
    natOp: 'Prestação de serviço de comunicação a estabelecimento industrial',
  },
  {
    code: '5303',
    natOp: 'Prestação de serviço de comunicação a estabelecimento comercial',
  },
  {
    code: '5304',
    natOp:
      'Prestação de serviço de comunicação a estabelecimento de prestador de serviço de transporte',
  },
  {
    code: '5305',
    natOp:
      'Prestação de serviço de comunicação a estabelecimento gerador, transmissor ou distribuidor de energia elétrica',
  },
  {
    code: '5306',
    natOp: 'Prestação de serviço de comunicação a estabelecimento de produtor rural',
  },
  {
    code: '5307',
    natOp: 'Prestação de serviço de comunicação a não contribuinte',
  },
  {
    code: '5351',
    natOp: 'Prestação de serviço de transporte a estabelecimento industrial',
  },
  {
    code: '5352',
    natOp: 'Prestação de serviço de transporte a estabelecimento comercial',
  },
  {
    code: '5353',
    natOp:
      'Prestação de serviço de transporte a estabelecimento gerador, transmissor ou distribuidor de energia elétrica',
  },
  {
    code: '5354',
    natOp:
      'Prestação de serviço de transporte a estabelecimento prestador de serviço de comunicação',
  },
  {
    code: '5355',
    natOp: 'Prestação de serviço de transporte a estabelecimento de produtor rural',
  },
  {
    code: '5356',
    natOp:
      'Prestação de serviço de transporte a estabelecimento de prestador de serviço de transporte',
  },
  {
    code: '5357',
    natOp: 'Prestação de serviço de transporte a não contribuinte',
  },
  {
    code: '5401',
    natOp:
      'Venda de produção do estabelecimento em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '5402',
    natOp:
      'Venda de produção do estabelecimento de produto sujeito ao regime de substituição tributária, em operação entre contribuintes substitutos do mesmo produto',
  },
  {
    code: '5403',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária, na condição de contribuinte substituto',
  },
  {
    code: '5405',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros, sujeita ao regime de substituição tributária, na condição de contribuinte substituído',
  },
  {
    code: '5408',
    natOp:
      'Transferência de produção do estabelecimento em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '5409',
    natOp:
      'Transferência de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '5410',
    natOp:
      'Devolução de compra para industrialização ou produção rural em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '5411',
    natOp:
      'Devolução de compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '5412',
    natOp:
      'Devolução de bem do ativo imobilizado, em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '5413',
    natOp:
      'Devolução de mercadoria destinada ao uso ou consumo, em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '5414',
    natOp:
      'Remessa de produção do estabelecimento para venda fora do estabelecimento, em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '5415',
    natOp:
      'Remessa de mercadoria adquirida ou recebida de terceiros para venda fora do estabelecimento, em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '5501',
    natOp: 'Remessa de produção do estabelecimento, com fim específico de exportação',
  },
  {
    code: '5502',
    natOp:
      'Remessa de mercadoria adquirida ou recebida de terceiros, com fim específico de exportação',
  },
  {
    code: '5503',
    natOp: 'Devolução de mercadoria recebida com fim específico de exportação',
  },
  {
    code: '5504',
    natOp:
      'Remessa de mercadoria para formação de lote de exportação, adquirida ou recebida de terceiros',
  },
  {
    code: '5505',
    natOp: 'Remessa de produto para formação de lote de exportação, produzido pelo estabelecimento',
  },
  {
    code: '5551',
    natOp: 'Venda de bem do ativo imobilizado',
  },
  {
    code: '5552',
    natOp: 'Transferência de bem do ativo imobilizado',
  },
  {
    code: '5553',
    natOp: 'Devolução de compra de bem para o ativo imobilizado',
  },
  {
    code: '5554',
    natOp: 'Remessa de bem do ativo imobilizado para uso fora do estabelecimento',
  },
  {
    code: '5555',
    natOp: 'Devolução de bem do ativo imobilizado recebido para uso fora do estabelecimento',
  },
  {
    code: '5556',
    natOp: 'Devolução de compra de material de uso ou consumo',
  },
  {
    code: '5557',
    natOp: 'Transferência de material de uso ou consumo',
  },
  {
    code: '5601',
    natOp: 'Transferência de crédito de ICMS acumulado',
  },
  {
    code: '5602',
    natOp:
      'Transferência de saldo credor de ICMS de outro estabelecimento da mesma empresa, para compensação de saldo devedor de ICMS',
  },
  {
    code: '5603',
    natOp: 'Ressarcimento de ICMS retido por substituição tributária',
  },
  {
    code: '5605',
    natOp: 'Transferência de saldo credor de ICMS para outra empresa',
  },
  {
    code: '5606',
    natOp: 'Utilização de saldo credor de ICMS para quitação de débito de ICMS',
  },
  {
    code: '5651',
    natOp:
      'Venda de combustível ou lubrificante de produção do estabelecimento destinados à industrialização subseqüente',
  },
  {
    code: '5652',
    natOp:
      'Venda de combustível ou lubrificante de produção do estabelecimento destinados à comercialização',
  },
  {
    code: '5653',
    natOp:
      'Venda de combustível ou lubrificante de produção do estabelecimento destinados a consumidor ou usuário final',
  },
  {
    code: '5654',
    natOp:
      'Venda de combustível ou lubrificante adquiridos ou recebidos de terceiros destinados à industrialização subseqüente',
  },
  {
    code: '5655',
    natOp:
      'Venda de combustível ou lubrificante adquiridos ou recebidos de terceiros destinados à comercialização',
  },
  {
    code: '5656',
    natOp:
      'Venda de combustível ou lubrificante adquiridos ou recebidos de terceiros destinados a consumidor ou usuário final',
  },
  {
    code: '5657',
    natOp:
      'Remessa de combustível ou lubrificante adquiridos ou recebidos de terceiros para venda fora do estabelecimento',
  },
  {
    code: '5658',
    natOp: 'Transferência de combustível ou lubrificante de produção do estabelecimento',
  },
  {
    code: '5659',
    natOp: 'Transferência de combustível ou lubrificante adquiridos ou recebidos de terceiros',
  },
  {
    code: '5660',
    natOp:
      'Devolução de compra de combustível ou lubrificante adquiridos para industrialização subseqüente',
  },
  {
    code: '5661',
    natOp: 'Devolução de compra de combustível ou lubrificante adquiridos para comercialização',
  },
  {
    code: '5662',
    natOp:
      'Devolução de compra de combustível ou lubrificante adquiridos por consumidor ou usuário final',
  },
  {
    code: '5901',
    natOp: 'Remessa para industrialização por encomenda',
  },
  {
    code: '5902',
    natOp: 'Retorno de mercadoria utilizada na industrialização por encomenda',
  },
  {
    code: '5903',
    natOp:
      'Retorno de mercadoria remetida para industrialização e não aplicada no processo industrial',
  },
  {
    code: '5904',
    natOp: 'Remessa para venda fora do estabelecimento',
  },
  {
    code: '5905',
    natOp: 'Remessa para depósito fechado ou armazém geral',
  },
  {
    code: '5906',
    natOp: 'Retorno de mercadoria depositada em depósito fechado ou armazém geral',
  },
  {
    code: '5907',
    natOp: 'Retorno de mercadoria remetida para depósito fechado ou armazém geral',
  },
  {
    code: '5908',
    natOp: 'Remessa de bem por empréstimo',
  },
  {
    code: '5909',
    natOp: 'Retorno de bem recebido por empréstimo',
  },
  {
    code: '5910',
    natOp: 'Remessa em bonificação, doação ou brinde',
  },
  {
    code: '5911',
    natOp: 'Remessa de amostra grátis',
  },
  {
    code: '5912',
    natOp: 'Remessa de mercadoria ou bem para demonstração',
  },
  {
    code: '5913',
    natOp: 'Retorno de mercadoria ou bem recebido para demonstração',
  },
  {
    code: '5914',
    natOp: 'Remessa de mercadoria ou bem para exposição ou feira',
  },
  {
    code: '5915',
    natOp: 'Remessa de mercadoria ou bem para conserto ou reparo',
  },
  {
    code: '5916',
    natOp: 'Retorno de mercadoria ou bem recebido para conserto ou reparo',
  },
  {
    code: '5917',
    natOp: 'Remessa de mercadoria em consignação mercantil ou industrial',
  },
  {
    code: '5918',
    natOp: 'Devolução de mercadoria recebida em consignação mercantil ou industrial',
  },
  {
    code: '5919',
    natOp: 'Devolução de mercadoria recebida em consignação dados em comodato',
  },
  {
    code: '5920',
    natOp: 'Remessa de vasilhame ou sacaria',
  },
  {
    code: '5921',
    natOp: 'Devolução de vasilhame ou sacaria',
  },
  {
    code: '5922',
    natOp:
      'Lançamento efetuado a título de simples faturamento decorrente de venda para entrega futura',
  },
  {
    code: '5923',
    natOp:
      'Remessa de mercadoria por conta e ordem de terceiros, em venda à ordem ou em operações com armazém geral ou depósito fechado',
  },
  {
    code: '5924',
    natOp:
      'Remessa para industrialização por conta e ordem do adquirente da mercadoria, quando esta não transitar pelo estabelecimento do adquirente',
  },
  {
    code: '5925',
    natOp:
      'Retorno de mercadoria recebida para industrialização por conta e ordem do adquirente da mercadoria, quando esta não transitar pelo estabelecimento do adquirente',
  },
  {
    code: '5926',
    natOp:
      'Lançamento efetuado a título de reclassificação de mercadoria decorrente de formação de kit ou de sua desestruturação',
  },
  {
    code: '5927',
    natOp:
      'Lançamento efetuado a título de baixa de estoque decorrente de perda, roubo ou deterioração',
  },
  {
    code: '5928',
    natOp:
      'Lançamento efetuado a título de baixa de estoque decorrente de descontinuidade da atividade',
  },
  {
    code: '5929',
    natOp:
      'Lançamento efetuado em decorrência de emissão de documento fiscal relativo a operação ou prestação também registrada em equipamento Emissor de Cupom Fiscal - ECF',
  },
  {
    code: '5931',
    natOp:
      'Lançamento efetuado em decorrência de emissão de documento fiscal relativo a prestação de serviço de transporte',
  },
  {
    code: '5932',
    natOp:
      'Prestação de serviço de transporte iniciada em UF diversa daquela onde inscrito o prestador',
  },
  {
    code: '5933',
    natOp: 'Prestação de serviço tributado pelo ISSQN',
  },
  {
    code: '5934',
    natOp: 'Transmissão de propriedade de mercadoria por terceiro',
  },
  {
    code: '5949',
    natOp: 'Outra saída de mercadoria ou prestação de serviço não especificada',
  },
  {
    code: '6101',
    natOp: 'Venda de produção do estabelecimento',
  },
  {
    code: '6102',
    natOp: 'Venda de mercadoria adquirida ou recebida de terceiros',
  },
  {
    code: '6103',
    natOp: 'Venda de produção do estabelecimento, efetuada fora do estabelecimento',
  },
  {
    code: '6104',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros, efetuada fora do estabelecimento',
  },
  {
    code: '6105',
    natOp:
      'Venda de produção do estabelecimento que não deva transitar pelo estabelecimento do vendedor',
  },
  {
    code: '6106',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros, que não deva transitar pelo estabelecimento do vendedor',
  },
  {
    code: '6107',
    natOp: 'Venda de produção do estabelecimento, destinada a não contribuinte',
  },
  {
    code: '6108',
    natOp: 'Venda de mercadoria adquirida ou recebida de terceiros, destinada a não contribuinte',
  },
  {
    code: '6109',
    natOp:
      'Venda de produção do estabelecimento destinada à Zona Franca de Manaus ou Áreas de Livre Comércio',
  },
  {
    code: '6110',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros, destinada à Zona Franca de Manaus ou Áreas de Livre Comércio',
  },
  {
    code: '6111',
    natOp: 'Venda de produção do estabelecimento remetida anteriormente em consignação industrial',
  },
  {
    code: '6112',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros remetida anteriormente em consignação industrial',
  },
  {
    code: '6113',
    natOp: 'Venda de produção do estabelecimento remetida anteriormente em consignação mercantil',
  },
  {
    code: '6114',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros remetida anteriormente em consignação mercantil',
  },
  {
    code: '6115',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros, recebida anteriormente em consignação mercantil',
  },
  {
    code: '6116',
    natOp: 'Venda de produção do estabelecimento originada de encomenda para entrega futura',
  },
  {
    code: '6117',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros, originada de encomenda para entrega futura',
  },
  {
    code: '6118',
    natOp:
      'Venda de produção do estabelecimento entregue ao destinatário por conta e ordem do adquirente originário, em venda à ordem',
  },
  {
    code: '6119',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros entregue ao destinatário por conta e ordem do adquirente originário, em venda à ordem',
  },
  {
    code: '6120',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros entregue ao destinatário pelo vendedor remetente, em venda à ordem',
  },
  {
    code: '6122',
    natOp:
      'Venda de produção do estabelecimento remetida para industrialização, por conta e ordem do adquirente, sem transitar pelo estabelecimento do adquirente',
  },
  {
    code: '6123',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros remetida para industrialização, por conta e ordem do adquirente, sem transitar pelo estabelecimento do adquirente',
  },
  {
    code: '6124',
    natOp: 'Industrialização efetuada para outra empresa',
  },
  {
    code: '6125',
    natOp:
      'Industrialização efetuada para outra empresa quando a mercadoria recebida para industrialização não transitar pelo estabelecimento do adquirente',
  },
  {
    code: '6151',
    natOp: 'Transferência de produção do estabelecimento',
  },
  {
    code: '6152',
    natOp: 'Transferência de mercadoria adquirida ou recebida de terceiros',
  },
  {
    code: '6153',
    natOp: 'Transferência de energia elétrica',
  },
  {
    code: '6155',
    natOp:
      'Transferência de produção do estabelecimento que não deva transitar pelo estabelecimento do remetente',
  },
  {
    code: '6156',
    natOp:
      'Transferência de mercadoria adquirida ou recebida de terceiros que não deva transitar pelo estabelecimento do remetente',
  },
  {
    code: '6201',
    natOp: 'Devolução de compra para industrialização ou produção rural',
  },
  {
    code: '6202',
    natOp: 'Devolução de compra para comercialização',
  },
  {
    code: '6205',
    natOp: 'Anulação de valor relativo a serviço de comunicação',
  },
  {
    code: '6206',
    natOp: 'Anulação de valor relativo a serviço de transporte',
  },
  {
    code: '6207',
    natOp: 'Anulação de valor relativo ao fornecimento de energia elétrica',
  },
  {
    code: '6208',
    natOp:
      'Devolução de mercadoria recebida em transferência para industrialização ou produção rural',
  },
  {
    code: '6209',
    natOp: 'Devolução de mercadoria recebida em transferência para comercialização',
  },
  {
    code: '6210',
    natOp: 'Devolução de compra para utilização na prestação de serviço',
  },
  {
    code: '6251',
    natOp: 'Venda de energia elétrica para distribuição ou comercialização',
  },
  {
    code: '6252',
    natOp: 'Venda de energia elétrica para estabelecimento industrial',
  },
  {
    code: '6253',
    natOp: 'Venda de energia elétrica para estabelecimento comercial',
  },
  {
    code: '6254',
    natOp: 'Venda de energia elétrica para estabelecimento prestador de serviço de transporte',
  },
  {
    code: '6255',
    natOp: 'Venda de energia elétrica para estabelecimento prestador de serviço de comunicação',
  },
  {
    code: '6256',
    natOp: 'Venda de energia elétrica para estabelecimento de produtor rural',
  },
  {
    code: '6257',
    natOp: 'Venda de energia elétrica para consumo por demanda contratada',
  },
  {
    code: '6258',
    natOp: 'Venda de energia elétrica a não contribuinte',
  },
  {
    code: '6301',
    natOp: 'Prestação de serviço de comunicação para execução de serviço da mesma natureza',
  },
  {
    code: '6302',
    natOp: 'Prestação de serviço de comunicação a estabelecimento industrial',
  },
  {
    code: '6303',
    natOp: 'Prestação de serviço de comunicação a estabelecimento comercial',
  },
  {
    code: '6304',
    natOp:
      'Prestação de serviço de comunicação a estabelecimento de prestador de serviço de transporte',
  },
  {
    code: '6305',
    natOp:
      'Prestação de serviço de comunicação a estabelecimento gerador, transmissor ou distribuidor de energia elétrica',
  },
  {
    code: '6306',
    natOp: 'Prestação de serviço de comunicação a estabelecimento de produtor rural',
  },
  {
    code: '6307',
    natOp: 'Prestação de serviço de comunicação a não contribuinte',
  },
  {
    code: '6351',
    natOp: 'Prestação de serviço de transporte a estabelecimento industrial',
  },
  {
    code: '6352',
    natOp: 'Prestação de serviço de transporte a estabelecimento comercial',
  },
  {
    code: '6353',
    natOp:
      'Prestação de serviço de transporte a estabelecimento gerador, transmissor ou distribuidor de energia elétrica',
  },
  {
    code: '6354',
    natOp:
      'Prestação de serviço de transporte a estabelecimento prestador de serviço de comunicação',
  },
  {
    code: '6355',
    natOp: 'Prestação de serviço de transporte a estabelecimento de produtor rural',
  },
  {
    code: '6356',
    natOp:
      'Prestação de serviço de transporte a estabelecimento de prestador de serviço de transporte',
  },
  {
    code: '6357',
    natOp: 'Prestação de serviço de transporte a não contribuinte',
  },
  {
    code: '6401',
    natOp:
      'Venda de produção do estabelecimento em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '6402',
    natOp:
      'Venda de produção do estabelecimento de produto sujeito ao regime de substituição tributária, em operação entre contribuintes substitutos do mesmo produto',
  },
  {
    code: '6403',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária, na condição de contribuinte substituto',
  },
  {
    code: '6404',
    natOp:
      'Venda de mercadoria sujeita ao regime de substituição tributária, cujo imposto já tenha sido retido anteriormente',
  },
  {
    code: '6408',
    natOp:
      'Transferência de produção do estabelecimento em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '6409',
    natOp:
      'Transferência de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '6410',
    natOp:
      'Devolução de compra para industrialização ou produção rural em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '6411',
    natOp:
      'Devolução de compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '6412',
    natOp:
      'Devolução de bem do ativo imobilizado, em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '6413',
    natOp:
      'Devolução de mercadoria destinada ao uso ou consumo, em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '6414',
    natOp:
      'Remessa de produção do estabelecimento para venda fora do estabelecimento, em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '6415',
    natOp:
      'Remessa de mercadoria adquirida ou recebida de terceiros para venda fora do estabelecimento, em operação com mercadoria sujeita ao regime de substituição tributária',
  },
  {
    code: '6501',
    natOp: 'Remessa de produção do estabelecimento, com fim específico de exportação',
  },
  {
    code: '6502',
    natOp:
      'Remessa de mercadoria adquirida ou recebida de terceiros, com fim específico de exportação',
  },
  {
    code: '6503',
    natOp: 'Devolução de mercadoria recebida com fim específico de exportação',
  },
  {
    code: '6504',
    natOp:
      'Remessa de mercadoria para formação de lote de exportação, adquirida ou recebida de terceiros',
  },
  {
    code: '6505',
    natOp: 'Remessa de produto para formação de lote de exportação, produzido pelo estabelecimento',
  },
  {
    code: '6551',
    natOp: 'Venda de bem do ativo imobilizado',
  },
  {
    code: '6552',
    natOp: 'Transferência de bem do ativo imobilizado',
  },
  {
    code: '6553',
    natOp: 'Devolução de compra de bem para o ativo imobilizado',
  },
  {
    code: '6554',
    natOp: 'Remessa de bem do ativo imobilizado para uso fora do estabelecimento',
  },
  {
    code: '6555',
    natOp: 'Devolução de bem do ativo imobilizado recebido para uso fora do estabelecimento',
  },
  {
    code: '6556',
    natOp: 'Devolução de compra de material de uso ou consumo',
  },
  {
    code: '6557',
    natOp: 'Transferência de material de uso ou consumo',
  },
  {
    code: '6601',
    natOp: 'Transferência de crédito de ICMS acumulado',
  },
  {
    code: '6602',
    natOp:
      'Transferência de saldo credor de ICMS de outro estabelecimento da mesma empresa, para compensação de saldo devedor de ICMS',
  },
  {
    code: '6603',
    natOp: 'Ressarcimento de ICMS retido por substituição tributária',
  },
  {
    code: '6651',
    natOp:
      'Venda de combustível ou lubrificante de produção do estabelecimento destinados à industrialização subseqüente',
  },
  {
    code: '6652',
    natOp:
      'Venda de combustível ou lubrificante de produção do estabelecimento destinados à comercialização',
  },
  {
    code: '6653',
    natOp:
      'Venda de combustível ou lubrificante de produção do estabelecimento destinados a consumidor ou usuário final',
  },
  {
    code: '6654',
    natOp:
      'Venda de combustível ou lubrificante adquiridos ou recebidos de terceiros destinados à industrialização subseqüente',
  },
  {
    code: '6655',
    natOp:
      'Venda de combustível ou lubrificante adquiridos ou recebidos de terceiros destinados à comercialização',
  },
  {
    code: '6656',
    natOp:
      'Venda de combustível ou lubrificante adquiridos ou recebidos de terceiros destinados a consumidor ou usuário final',
  },
  {
    code: '6657',
    natOp:
      'Remessa de combustível ou lubrificante adquiridos ou recebidos de terceiros para venda fora do estabelecimento',
  },
  {
    code: '6658',
    natOp: 'Transferência de combustível ou lubrificante de produção do estabelecimento',
  },
  {
    code: '6659',
    natOp: 'Transferência de combustível ou lubrificante adquiridos ou recebidos de terceiros',
  },
  {
    code: '6660',
    natOp:
      'Devolução de compra de combustível ou lubrificante adquiridos para industrialização subseqüente',
  },
  {
    code: '6661',
    natOp: 'Devolução de compra de combustível ou lubrificante adquiridos para comercialização',
  },
  {
    code: '6662',
    natOp:
      'Devolução de compra de combustível ou lubrificante adquiridos por consumidor ou usuário final',
  },
  {
    code: '6901',
    natOp: 'Remessa para industrialização por encomenda',
  },
  {
    code: '6902',
    natOp: 'Retorno de mercadoria utilizada na industrialização por encomenda',
  },
  {
    code: '6903',
    natOp:
      'Retorno de mercadoria remetida para industrialização e não aplicada no processo industrial',
  },
  {
    code: '6904',
    natOp: 'Remessa para venda fora do estabelecimento',
  },
  {
    code: '6905',
    natOp: 'Remessa para depósito fechado ou armazém geral',
  },
  {
    code: '6906',
    natOp: 'Retorno de mercadoria depositada em depósito fechado ou armazém geral',
  },
  {
    code: '6907',
    natOp: 'Retorno de mercadoria remetida para depósito fechado ou armazém geral',
  },
  {
    code: '6908',
    natOp: 'Remessa de bem por empréstimo',
  },
  {
    code: '6909',
    natOp: 'Retorno de bem recebido por empréstimo',
  },
  {
    code: '6910',
    natOp: 'Remessa em bonificação, doação ou brinde',
  },
  {
    code: '6911',
    natOp: 'Remessa de amostra grátis',
  },
  {
    code: '6912',
    natOp: 'Remessa de mercadoria ou bem para demonstração',
  },
  {
    code: '6913',
    natOp: 'Retorno de mercadoria ou bem recebido para demonstração',
  },
  {
    code: '6914',
    natOp: 'Remessa de mercadoria ou bem para exposição ou feira',
  },
  {
    code: '6915',
    natOp: 'Remessa de mercadoria ou bem para conserto ou reparo',
  },
  {
    code: '6916',
    natOp: 'Retorno de mercadoria ou bem recebido para conserto ou reparo',
  },
  {
    code: '6917',
    natOp: 'Remessa de mercadoria em consignação mercantil ou industrial',
  },
  {
    code: '6918',
    natOp: 'Devolução de mercadoria recebida em consignação mercantil ou industrial',
  },
  {
    code: '6919',
    natOp: 'Devolução de mercadoria recebida em consignação dados em comodato',
  },
  {
    code: '6920',
    natOp: 'Remessa de vasilhame ou sacaria',
  },
  {
    code: '6921',
    natOp: 'Devolução de vasilhame ou sacaria',
  },
  {
    code: '6922',
    natOp:
      'Lançamento efetuado a título de simples faturamento decorrente de venda para entrega futura',
  },
  {
    code: '6923',
    natOp:
      'Remessa de mercadoria por conta e ordem de terceiros, em venda à ordem ou em operações com armazém geral ou depósito fechado',
  },
  {
    code: '6924',
    natOp:
      'Remessa para industrialização por conta e ordem do adquirente da mercadoria, quando esta não transitar pelo estabelecimento do adquirente',
  },
  {
    code: '6925',
    natOp:
      'Retorno de mercadoria recebida para industrialização por conta e ordem do adquirente da mercadoria, quando esta não transitar pelo estabelecimento do adquirente',
  },
  {
    code: '6929',
    natOp:
      'Lançamento efetuado em decorrência de emissão de documento fiscal relativo a operação ou prestação também registrada em equipamento Emissor de Cupom Fiscal - ECF',
  },
  {
    code: '6931',
    natOp:
      'Lançamento efetuado em decorrência de emissão de documento fiscal relativo a prestação de serviço de transporte',
  },
  {
    code: '6932',
    natOp:
      'Prestação de serviço de transporte iniciada em UF diversa daquela onde inscrito o prestador',
  },
  {
    code: '6933',
    natOp: 'Prestação de serviço tributado pelo ISSQN',
  },
  {
    code: '6934',
    natOp: 'Transmissão de propriedade de mercadoria por terceiro',
  },
  {
    code: '6949',
    natOp: 'Outra saída de mercadoria ou prestação de serviço não especificada',
  },
  {
    code: '7101',
    natOp: 'Venda de produção do estabelecimento',
  },
  {
    code: '7102',
    natOp: 'Venda de mercadoria adquirida ou recebida de terceiros',
  },
  {
    code: '7105',
    natOp:
      'Venda de produção do estabelecimento que não deva transitar pelo estabelecimento do vendedor',
  },
  {
    code: '7106',
    natOp:
      'Venda de mercadoria adquirida ou recebida de terceiros, que não deva transitar pelo estabelecimento do vendedor',
  },
  {
    code: '7127',
    natOp: 'Venda de produção do estabelecimento sob o regime de draw-back',
  },
  {
    code: '7201',
    natOp: 'Devolução de compra para industrialização ou produção rural',
  },
  {
    code: '7202',
    natOp: 'Devolução de compra para comercialização',
  },
  {
    code: '7205',
    natOp: 'Anulação de valor relativo à prestação de serviço de comunicação',
  },
  {
    code: '7206',
    natOp: 'Anulação de valor relativo à prestação de serviço de transporte',
  },
  {
    code: '7207',
    natOp: 'Anulação de valor relativo à venda de energia elétrica',
  },
  {
    code: '7210',
    natOp: 'Devolução de compra para utilização na prestação de serviço',
  },
  {
    code: '7211',
    natOp: 'Devolução de compras de mercadorias efetuadas sob o regime de draw-back',
  },
  {
    code: '7251',
    natOp: 'Venda de energia elétrica para exterior',
  },
  {
    code: '7301',
    natOp: 'Prestação de serviço de comunicação para execução de serviço da mesma natureza',
  },
  {
    code: '7358',
    natOp: 'Prestação de serviço de transporte',
  },
  {
    code: '7501',
    natOp: 'Exportação de mercadorias recebidas com fim específico de exportação',
  },
  {
    code: '7551',
    natOp: 'Venda de bem do ativo imobilizado',
  },
  {
    code: '7553',
    natOp: 'Devolução de compra de bem para o ativo imobilizado',
  },
  {
    code: '7556',
    natOp: 'Devolução de compra de material de uso ou consumo',
  },
  {
    code: '7651',
    natOp: 'Venda de combustível ou lubrificante de produção do estabelecimento',
  },
  {
    code: '7654',
    natOp: 'Venda de combustível ou lubrificante adquiridos ou recebidos de terceiros',
  },
  {
    code: '7930',
    natOp:
      'Lançamento efetuado a título de devolução de bem cuja entrada tenha ocorrido sob o regime de admissão temporária',
  },
  {
    code: '7949',
    natOp: 'Outra saída de mercadoria ou prestação de serviço não especificada',
  },
];
