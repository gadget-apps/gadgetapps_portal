export type TutorialProfile = "Comum" | "Contratante" | "Profissional";

export type TutorialCatalogItem = {
  id: string;
  profile: TutorialProfile;
  module: string;
  title: string;
  file: string;
};

/** Catálogo estático dos vídeos tutoriais (pasta local). Links do YouTube ficam no Firestore.
 *  Static catalog of tutorial videos (local folder). YouTube links live in Firestore. */
export const TUTORIAL_CATALOG: TutorialCatalogItem[] = [
  {
    "id": "01_login_01_realizar_login",
    "profile": "Comum",
    "module": "Login",
    "title": "Realizar Login",
    "file": "01 - Login/01 - Realizar Login.webm"
  },
  {
    "id": "01_login_02_ativar_login_com_biometria",
    "profile": "Comum",
    "module": "Login",
    "title": "Ativar Login com Biometria",
    "file": "01 - Login/02 - Ativar Login com Biometria.webm"
  },
  {
    "id": "01_login_03_esqueci_minha_senha",
    "profile": "Comum",
    "module": "Login",
    "title": "Esqueci Minha Senha",
    "file": "01 - Login/03 - Esqueci Minha Senha.webm"
  },
  {
    "id": "01_login_04_realizar_login_no_modo_assistido",
    "profile": "Comum",
    "module": "Login",
    "title": "Realizar Login no Modo Assistido",
    "file": "01 - Login/04 - Realizar Login no Modo Assistido.webm"
  },
  {
    "id": "02_contratante_assistido_01_cadastrar_01_cadastro_contratante",
    "profile": "Contratante",
    "module": "Cadastrar",
    "title": "Cadastro Contratante",
    "file": "02 - Contratante_Assistido/01 - Cadastrar/01 - Cadastro Contratante.webm"
  },
  {
    "id": "02_contratante_assistido_01_cadastrar_02_cadastro_assistido",
    "profile": "Contratante",
    "module": "Cadastrar",
    "title": "Cadastro Assistido",
    "file": "02 - Contratante_Assistido/01 - Cadastrar/02 - Cadastro Assistido.webm"
  },
  {
    "id": "02_contratante_assistido_01_cadastrar_03_cadastro_necessidades",
    "profile": "Contratante",
    "module": "Cadastrar",
    "title": "Cadastro Necessidades",
    "file": "02 - Contratante_Assistido/01 - Cadastrar/03 - Cadastro Necessidades.webm"
  },
  {
    "id": "02_contratante_assistido_01_cadastrar_04_central_de_controle_tela_home",
    "profile": "Contratante",
    "module": "Cadastrar",
    "title": "Central de Controle (tela home)",
    "file": "02 - Contratante_Assistido/01 - Cadastrar/04 - Central de Controle (tela home).webm"
  },
  {
    "id": "02_contratante_assistido_02_alterar_dados_do_cadastro_01_alterar_dados_do_contratante",
    "profile": "Contratante",
    "module": "Alterar Dados do Cadastro",
    "title": "Alterar dados do Contratante",
    "file": "02 - Contratante_Assistido/02 - Alterar Dados do Cadastro/01 - Alterar dados do Contratante.webm"
  },
  {
    "id": "02_contratante_assistido_02_alterar_dados_do_cadastro_02_alterar_dados_do_assistido",
    "profile": "Contratante",
    "module": "Alterar Dados do Cadastro",
    "title": "Alterar dados do Assistido",
    "file": "02 - Contratante_Assistido/02 - Alterar Dados do Cadastro/02 - Alterar dados do Assistido.webm"
  },
  {
    "id": "02_contratante_assistido_02_alterar_dados_do_cadastro_03_alterar_necessidades_do_assistido",
    "profile": "Contratante",
    "module": "Alterar Dados do Cadastro",
    "title": "Alterar necessidades do Assistido",
    "file": "02 - Contratante_Assistido/02 - Alterar Dados do Cadastro/03 - Alterar necessidades do Assistido.webm"
  },
  {
    "id": "02_contratante_assistido_03_pesquisar_01_buscar_profissionais",
    "profile": "Contratante",
    "module": "Pesquisar",
    "title": "Buscar Profissionais",
    "file": "02 - Contratante_Assistido/03 - Pesquisar/01 - Buscar Profissionais.webm"
  },
  {
    "id": "02_contratante_assistido_03_pesquisar_02_filtrar_profissionais",
    "profile": "Contratante",
    "module": "Pesquisar",
    "title": "Filtrar Profissionais",
    "file": "02 - Contratante_Assistido/03 - Pesquisar/02 - Filtrar Profissionais.webm"
  },
  {
    "id": "02_contratante_assistido_03_pesquisar_03_card_profissional_e_seus_detalhes",
    "profile": "Contratante",
    "module": "Pesquisar",
    "title": "Card Profissional e Seus Detalhes",
    "file": "02 - Contratante_Assistido/03 - Pesquisar/03 - Card Profissional e Seus Detalhes.webm"
  },
  {
    "id": "02_contratante_assistido_03_pesquisar_04_salvar_profissionais_favoritar",
    "profile": "Contratante",
    "module": "Pesquisar",
    "title": "Salvar Profissionais (Favoritar)",
    "file": "02 - Contratante_Assistido/03 - Pesquisar/04 - Salvar Profissionais (Favoritar).webm"
  },
  {
    "id": "02_contratante_assistido_03_pesquisar_05_organizacao_dos_cards_por_distancia_do_local_da_p",
    "profile": "Contratante",
    "module": "Pesquisar",
    "title": "Organização dos Cards (por distância do local da prestação do serviço)",
    "file": "02 - Contratante_Assistido/03 - Pesquisar/05 - Organização dos Cards (por distância do local da prestação do serviço).webm"
  },
  {
    "id": "02_contratante_assistido_04_convites_de_conexao_01_enviar_convite_de_conexao_para_contrata",
    "profile": "Contratante",
    "module": "Convites de Conexão",
    "title": "Enviar Convite de Conexão para Contratante",
    "file": "02 - Contratante_Assistido/04 - Convites de Conexão/01 - Enviar Convite de Conexão para Contratante.webm"
  },
  {
    "id": "02_contratante_assistido_04_convites_de_conexao_02_aceitar_um_convite_de_conexao",
    "profile": "Contratante",
    "module": "Convites de Conexão",
    "title": "Aceitar um Convite de Conexão",
    "file": "02 - Contratante_Assistido/04 - Convites de Conexão/02 - Aceitar um Convite de Conexão.webm"
  },
  {
    "id": "02_contratante_assistido_05_ativar_plano_premium_ou_passes_01_ativacao_do_plano_premium_e_",
    "profile": "Contratante",
    "module": "Ativar Plano Premium ou Passes",
    "title": "Ativação do Plano Premium e Passes",
    "file": "02 - Contratante_Assistido/05 - Ativar Plano Premium ou Passes/01 - Ativação do Plano Premium e Passes.webm"
  },
  {
    "id": "02_contratante_assistido_06_enviar_proposta_de_contratacao_01_solicitar_curriculo_para_o_p",
    "profile": "Contratante",
    "module": "Enviar Proposta de Contratação",
    "title": "Solicitar currículo para o profissional",
    "file": "02 - Contratante_Assistido/06 - Enviar Proposta de Contratação/01 - Solicitar currículo para o profissional.webm"
  },
  {
    "id": "02_contratante_assistido_06_enviar_proposta_de_contratacao_02_ver_curriculo_enviado_pelo_p",
    "profile": "Contratante",
    "module": "Enviar Proposta de Contratação",
    "title": "Ver currículo enviado pelo profissional",
    "file": "02 - Contratante_Assistido/06 - Enviar Proposta de Contratação/02 - Ver currículo enviado pelo profissional.webm"
  },
  {
    "id": "02_contratante_assistido_06_enviar_proposta_de_contratacao_03_enviar_proposta_para_profiss",
    "profile": "Contratante",
    "module": "Enviar Proposta de Contratação",
    "title": "Enviar proposta para profissional",
    "file": "02 - Contratante_Assistido/06 - Enviar Proposta de Contratação/03 - Enviar proposta para profissional.webm"
  },
  {
    "id": "02_contratante_assistido_06_enviar_proposta_de_contratacao_04_proposta_aceita_pelo_profiss",
    "profile": "Contratante",
    "module": "Enviar Proposta de Contratação",
    "title": "Proposta aceita pelo profissional",
    "file": "02 - Contratante_Assistido/06 - Enviar Proposta de Contratação/04 - Proposta aceita pelo profissional.webm"
  },
  {
    "id": "02_contratante_assistido_07_gestao_contratos_01_visualizar_contrato",
    "profile": "Contratante",
    "module": "Gestão Contratos",
    "title": "Visualizar contrato",
    "file": "02 - Contratante_Assistido/07 - Gestão Contratos/01 - Visualizar contrato.webm"
  },
  {
    "id": "02_contratante_assistido_07_gestao_contratos_02_solicitar_e_desfazer_a_solicitacao_de_canc",
    "profile": "Contratante",
    "module": "Gestão Contratos",
    "title": "Solicitar e desfazer a solicitação de cancelamento",
    "file": "02 - Contratante_Assistido/07 - Gestão Contratos/02 - Solicitar e desfazer a solicitação de cancelamento.webm"
  },
  {
    "id": "02_contratante_assistido_07_gestao_contratos_03_recusar_pedido_de_cancelamento",
    "profile": "Contratante",
    "module": "Gestão Contratos",
    "title": "Recusar pedido de cancelamento",
    "file": "02 - Contratante_Assistido/07 - Gestão Contratos/03 - Recusar pedido de cancelamento.webm"
  },
  {
    "id": "02_contratante_assistido_07_gestao_contratos_04_cancelar_contrato_e_consultar_historico",
    "profile": "Contratante",
    "module": "Gestão Contratos",
    "title": "Cancelar contrato e consultar histórico",
    "file": "02 - Contratante_Assistido/07 - Gestão Contratos/04 - Cancelar contrato e consultar histórico.webm"
  },
  {
    "id": "02_contratante_assistido_08_gestao_de_tarefas_01_agendar_concluir_e_excluir_tarefas",
    "profile": "Contratante",
    "module": "Gestão de Tarefas",
    "title": "Agendar, concluir e excluir tarefas",
    "file": "02 - Contratante_Assistido/08 - Gestão de Tarefas/01 - Agendar, concluir e excluir tarefas.webm"
  },
  {
    "id": "02_contratante_assistido_09_gestao_de_contas_01_acessar_tela_pra_contratacao_de_planos_e_p",
    "profile": "Contratante",
    "module": "Gestão de Contas",
    "title": "Acessar tela pra contratação de planos e passes",
    "file": "02 - Contratante_Assistido/09 - Gestão de Contas/01 - Acessar tela pra contratação de planos e passes.webm"
  },
  {
    "id": "02_contratante_assistido_09_gestao_de_contas_02_desabilitar_conta",
    "profile": "Contratante",
    "module": "Gestão de Contas",
    "title": "Desabilitar conta",
    "file": "02 - Contratante_Assistido/09 - Gestão de Contas/02 - Desabilitar conta.webm"
  },
  {
    "id": "02_contratante_assistido_09_gestao_de_contas_03_excluir_conta_definitivamente",
    "profile": "Contratante",
    "module": "Gestão de Contas",
    "title": "Excluir conta definitivamente",
    "file": "02 - Contratante_Assistido/09 - Gestão de Contas/03 - Excluir conta definitivamente.webm"
  },
  {
    "id": "02_contratante_assistido_10_configuracoes_do_sistema_01_seguranca_alterar_senha_login_com_",
    "profile": "Contratante",
    "module": "Configurações do Sistema",
    "title": "Segurança - Alterar senha Login com biometria",
    "file": "02 - Contratante_Assistido/10 - Configurações do Sistema/01 - Segurança - Alterar senha_Login com biometria.webm"
  },
  {
    "id": "02_contratante_assistido_10_configuracoes_do_sistema_02_modo_assistido_sensor_de_quedas_se",
    "profile": "Contratante",
    "module": "Configurações do Sistema",
    "title": "Modo Assistido - Sensor de quedas Sensor de localização Cerca virtual",
    "file": "02 - Contratante_Assistido/10 - Configurações do Sistema/02 - Modo Assistido - Sensor de quedas_Sensor de localização_Cerca virtual.webm"
  },
  {
    "id": "02_contratante_assistido_10_configuracoes_do_sistema_03_realatorios_sensores_modo_assistid",
    "profile": "Contratante",
    "module": "Configurações do Sistema",
    "title": "Realatórios - Sensores Modo Assistido",
    "file": "02 - Contratante_Assistido/10 - Configurações do Sistema/03 - Realatórios - Sensores_Modo Assistido.webm"
  },
  {
    "id": "02_contratante_assistido_11_modo_assistido_01_logar_no_modo_assistido",
    "profile": "Contratante",
    "module": "Modo Assistido",
    "title": "Logar no modo assistido",
    "file": "02 - Contratante_Assistido/11 - Modo Assistido/01 - Logar no modo assistido.webm"
  },
  {
    "id": "02_contratante_assistido_11_modo_assistido_02_logout_do_modo_assistido",
    "profile": "Contratante",
    "module": "Modo Assistido",
    "title": "Logout do modo assistido",
    "file": "02 - Contratante_Assistido/11 - Modo Assistido/02 - Logout do modo assistido.webm"
  },
  {
    "id": "02_contratante_assistido_11_modo_assistido_03_ativacao_botao_sos",
    "profile": "Contratante",
    "module": "Modo Assistido",
    "title": "Ativação botão sos",
    "file": "02 - Contratante_Assistido/11 - Modo Assistido/03 - Ativação botão sos.webm"
  },
  {
    "id": "02_contratante_assistido_11_modo_assistido_04_ativacao_do_sensor_de_quedas",
    "profile": "Contratante",
    "module": "Modo Assistido",
    "title": "Ativação do sensor de quedas",
    "file": "02 - Contratante_Assistido/11 - Modo Assistido/04 - Ativação do sensor de quedas.webm"
  },
  {
    "id": "02_contratante_assistido_11_modo_assistido_05_recepcao_de_mensagem_de_queda_apos_botao_sos",
    "profile": "Contratante",
    "module": "Modo Assistido",
    "title": "Recepção de mensagem de queda após botão SOS",
    "file": "02 - Contratante_Assistido/11 - Modo Assistido/05 - Recepção de mensagem de queda após botão SOS.webm"
  },
  {
    "id": "02_contratante_assistido_11_modo_assistido_06_recepcao_de_mensagem_de_queda_apos_ativacao_",
    "profile": "Contratante",
    "module": "Modo Assistido",
    "title": "Recepção de mensagem de queda após ativação do sensor de quedas",
    "file": "02 - Contratante_Assistido/11 - Modo Assistido/06 - Recepção de mensagem de queda após ativação do sensor de quedas.webm"
  },
  {
    "id": "02_contratante_assistido_11_modo_assistido_07_falso_positivo_sensor_de_quedas",
    "profile": "Contratante",
    "module": "Modo Assistido",
    "title": "Falso positivo sensor de quedas",
    "file": "02 - Contratante_Assistido/11 - Modo Assistido/07 - Falso positivo sensor de quedas.webm"
  },
  {
    "id": "02_contratante_assistido_12_sensor_de_localizacao_01_acompanhar_assistido_no_mapa",
    "profile": "Contratante",
    "module": "Sensor de Localização",
    "title": "Acompanhar assistido no mapa",
    "file": "02 - Contratante_Assistido/12 - Sensor de Localização/01 - Acompanhar assistido no mapa.webm"
  },
  {
    "id": "02_contratante_assistido_12_sensor_de_localizacao_02_aviso_rompimento_da_safe_zone",
    "profile": "Contratante",
    "module": "Sensor de Localização",
    "title": "Aviso rompimento da safe zone",
    "file": "02 - Contratante_Assistido/12 - Sensor de Localização/02 - Aviso rompimento da safe zone.webm"
  },
  {
    "id": "02_contratante_assistido_12_sensor_de_localizacao_03_alteracao_do_local_da_safe_zone",
    "profile": "Contratante",
    "module": "Sensor de Localização",
    "title": "Alteração do local da safe zone",
    "file": "02 - Contratante_Assistido/12 - Sensor de Localização/03 - Alteração do local da safe zone.webm"
  },
  {
    "id": "02_contratante_assistido_12_sensor_de_localizacao_04_retorno_a_safe_zone",
    "profile": "Contratante",
    "module": "Sensor de Localização",
    "title": "Retorno à safe zone",
    "file": "02 - Contratante_Assistido/12 - Sensor de Localização/04 - Retorno à safe zone.webm"
  },
  {
    "id": "02_contratante_assistido_13_central_de_mensagens_01_gestao_de_mensagens_na_central_de_mens",
    "profile": "Contratante",
    "module": "Central de Mensagens",
    "title": "Gestão de mensagens na central de mensagens",
    "file": "02 - Contratante_Assistido/13 - Central de Mensagens/01 - Gestão de mensagens na central de mensagens.webm"
  },
  {
    "id": "02_contratante_assistido_14_gestao_de_ponto_01_configuracoes_globais",
    "profile": "Contratante",
    "module": "Gestão de Ponto",
    "title": "Configurações Globais",
    "file": "02 - Contratante_Assistido/14 - Gestão de Ponto/01 - Configurações Globais.webm"
  },
  {
    "id": "02_contratante_assistido_14_gestao_de_ponto_02_local_de_prestacao",
    "profile": "Contratante",
    "module": "Gestão de Ponto",
    "title": "Local de Prestação",
    "file": "02 - Contratante_Assistido/14 - Gestão de Ponto/02 - Local de Prestação.webm"
  },
  {
    "id": "02_contratante_assistido_14_gestao_de_ponto_03_gestao_de_excecoes",
    "profile": "Contratante",
    "module": "Gestão de Ponto",
    "title": "Gestão de Exceções",
    "file": "02 - Contratante_Assistido/14 - Gestão de Ponto/03 - Gestão de Exceções.webm"
  },
  {
    "id": "02_contratante_assistido_14_gestao_de_ponto_04_ajuste_de_ponto",
    "profile": "Contratante",
    "module": "Gestão de Ponto",
    "title": "Ajuste de Ponto",
    "file": "02 - Contratante_Assistido/14 - Gestão de Ponto/04 - Ajuste de Ponto.webm"
  },
  {
    "id": "02_contratante_assistido_14_gestao_de_ponto_05_aprovacao_de_justificativa",
    "profile": "Contratante",
    "module": "Gestão de Ponto",
    "title": "Aprovação de Justificativa",
    "file": "02 - Contratante_Assistido/14 - Gestão de Ponto/05 - Aprovação de Justificativa.webm"
  },
  {
    "id": "02_contratante_assistido_14_gestao_de_ponto_06_espelho_de_ponto",
    "profile": "Contratante",
    "module": "Gestão de Ponto",
    "title": "Espelho de Ponto",
    "file": "02 - Contratante_Assistido/14 - Gestão de Ponto/06 - Espelho de Ponto.webm"
  },
  {
    "id": "02_contratante_assistido_14_gestao_de_ponto_07_horas_e_banco",
    "profile": "Contratante",
    "module": "Gestão de Ponto",
    "title": "Horas e Banco",
    "file": "02 - Contratante_Assistido/14 - Gestão de Ponto/07 - Horas e Banco.webm"
  },
  {
    "id": "02_contratante_assistido_15_gestao_de_reembolsos_01_aprovacao_de_reembolso",
    "profile": "Contratante",
    "module": "Gestão de Reembolsos",
    "title": "Aprovação de Reembolso",
    "file": "02 - Contratante_Assistido/15 - Gestão de Reembolsos/01 - Aprovação de Reembolso.webm"
  },
  {
    "id": "02_contratante_assistido_16_ajuda_e_suporte_01_duvidas_frequentes",
    "profile": "Contratante",
    "module": "Ajuda e Suporte",
    "title": "Dúvidas Frequentes",
    "file": "02 - Contratante_Assistido/16 - Ajuda e Suporte/01 - Dúvidas Frequentes.webm"
  },
  {
    "id": "02_contratante_assistido_16_ajuda_e_suporte_02_termos_e_contrato_de_utilizacao",
    "profile": "Contratante",
    "module": "Ajuda e Suporte",
    "title": "Termos e Contrato de Utilização",
    "file": "02 - Contratante_Assistido/16 - Ajuda e Suporte/02 - Termos e Contrato de Utilização.webm"
  },
  {
    "id": "02_contratante_assistido_16_ajuda_e_suporte_03_politica_de_privacidade",
    "profile": "Contratante",
    "module": "Ajuda e Suporte",
    "title": "Política de Privacidade",
    "file": "02 - Contratante_Assistido/16 - Ajuda e Suporte/03 - Política de Privacidade.webm"
  },
  {
    "id": "02_contratante_assistido_16_ajuda_e_suporte_04_falar_com_suporte",
    "profile": "Contratante",
    "module": "Ajuda e Suporte",
    "title": "Falar com Suporte",
    "file": "02 - Contratante_Assistido/16 - Ajuda e Suporte/04 - Falar com Suporte.webm"
  },
  {
    "id": "02_contratante_assistido_16_ajuda_e_suporte_05_ouvidoria",
    "profile": "Contratante",
    "module": "Ajuda e Suporte",
    "title": "Ouvidoria",
    "file": "02 - Contratante_Assistido/16 - Ajuda e Suporte/05 - Ouvidoria.webm"
  },
  {
    "id": "02_contratante_assistido_16_ajuda_e_suporte_06_sobre_o_app_angel_s_care",
    "profile": "Contratante",
    "module": "Ajuda e Suporte",
    "title": "Sobre o App Angel's Care",
    "file": "02 - Contratante_Assistido/16 - Ajuda e Suporte/06 - Sobre o App Angel's Care.webm"
  },
  {
    "id": "02_contratante_assistido_17_sair_do_app_01_sair_do_app",
    "profile": "Contratante",
    "module": "Sair do App",
    "title": "Sair do App",
    "file": "02 - Contratante_Assistido/17 - Sair do App/01 - Sair do App.webm"
  },
  {
    "id": "02_contratante_assistido_17_sair_do_app_02_sair_do_modo_assistido",
    "profile": "Contratante",
    "module": "Sair do App",
    "title": "Sair do Modo Assistido",
    "file": "02 - Contratante_Assistido/17 - Sair do App/02 - Sair do Modo Assistido.webm"
  },
  {
    "id": "03_profissional_01_cadastrar_01_cadastrar_profissional",
    "profile": "Profissional",
    "module": "Cadastrar",
    "title": "Cadastrar Profissional",
    "file": "03 - Profissional/01 - Cadastrar/01- Cadastrar Profissional.webm"
  },
  {
    "id": "03_profissional_01_cadastrar_02_cadastrar_habilidades_e_info_adic",
    "profile": "Profissional",
    "module": "Cadastrar",
    "title": "Cadastrar Habilidades e Info Adic",
    "file": "03 - Profissional/01 - Cadastrar/02 - Cadastrar Habilidades e Info_Adic.webm"
  },
  {
    "id": "03_profissional_01_cadastrar_03_central_de_trabalho_tela_home",
    "profile": "Profissional",
    "module": "Cadastrar",
    "title": "Central de Trabalho (Tela Home)",
    "file": "03 - Profissional/01 - Cadastrar/03- Central de Trabalho (Tela Home).webm"
  },
  {
    "id": "03_profissional_01_cadastrar_04_visualizar_a_media_da_regiao",
    "profile": "Profissional",
    "module": "Cadastrar",
    "title": "Visualizar a média da região",
    "file": "03 - Profissional/01 - Cadastrar/04 - Visualizar a média da região.webm"
  },
  {
    "id": "03_profissional_02_alterar_dados_do_cadastro_01_alterar_dados_do_profissional",
    "profile": "Profissional",
    "module": "Alterar Dados do Cadastro",
    "title": "Alterar dados do Profissional",
    "file": "03 - Profissional/02 - Alterar Dados do Cadastro/01 - Alterar dados do Profissional.webm"
  },
  {
    "id": "03_profissional_02_alterar_dados_do_cadastro_02_alterar_habilidades_do_profissional",
    "profile": "Profissional",
    "module": "Alterar Dados do Cadastro",
    "title": "Alterar habilidades do Profissional",
    "file": "03 - Profissional/02 - Alterar Dados do Cadastro/02 - Alterar habilidades do Profissional.webm"
  },
  {
    "id": "03_profissional_02_alterar_dados_do_cadastro_03_alterar_infos_adic_do_profissional",
    "profile": "Profissional",
    "module": "Alterar Dados do Cadastro",
    "title": "Alterar infos adic do Profissional",
    "file": "03 - Profissional/02 - Alterar Dados do Cadastro/03 - Alterar infos adic do Profissional.webm"
  },
  {
    "id": "03_profissional_03_pesquisar_01_buscar_oportunidades",
    "profile": "Profissional",
    "module": "Pesquisar",
    "title": "Buscar Oportunidades",
    "file": "03 - Profissional/03 - Pesquisar/01 - Buscar Oportunidades.webm"
  },
  {
    "id": "03_profissional_03_pesquisar_02_filtrar_oportunidade",
    "profile": "Profissional",
    "module": "Pesquisar",
    "title": "Filtrar Oportunidade",
    "file": "03 - Profissional/03 - Pesquisar/02 - Filtrar Oportunidade.webm"
  },
  {
    "id": "03_profissional_03_pesquisar_03_card_oportunidade_e_seus_detalhes",
    "profile": "Profissional",
    "module": "Pesquisar",
    "title": "Card Oportunidade e Seus Detalhes",
    "file": "03 - Profissional/03 - Pesquisar/03 - Card Oportunidade e Seus Detalhes.webm"
  },
  {
    "id": "03_profissional_03_pesquisar_04_salvar_oportunidade_favoritar",
    "profile": "Profissional",
    "module": "Pesquisar",
    "title": "Salvar Oportunidade (Favoritar)",
    "file": "03 - Profissional/03 - Pesquisar/04  -Salvar Oportunidade (Favoritar).webm"
  },
  {
    "id": "03_profissional_03_pesquisar_05_organizacao_dos_cards",
    "profile": "Profissional",
    "module": "Pesquisar",
    "title": "Organização dos Cards",
    "file": "03 - Profissional/03 - Pesquisar/05 - Organização dos Cards.webm"
  },
  {
    "id": "03_profissional_04_convites_de_conexao_01_enviar_convites_de_conexao_para_contratante",
    "profile": "Profissional",
    "module": "Convites de Conexão",
    "title": "Enviar Convites de Conexão para Contratante",
    "file": "03 - Profissional/04 - Convites de Conexão/01 - Enviar Convites de Conexão para Contratante.webm"
  },
  {
    "id": "03_profissional_04_convites_de_conexao_02_aceitar_convites_de_conexao",
    "profile": "Profissional",
    "module": "Convites de Conexão",
    "title": "Aceitar Convites de Conexão",
    "file": "03 - Profissional/04 - Convites de Conexão/02 - Aceitar Convites de Conexão.webm"
  },
  {
    "id": "03_profissional_05_ativar_plano_premium_ou_passes_01_ativacao_de_plano_premium_ou_passes",
    "profile": "Profissional",
    "module": "Ativar Plano Premium ou Passes",
    "title": "Ativação de Plano Premium ou Passes",
    "file": "03 - Profissional/05 - Ativar Plano Premium ou Passes/01 - Ativação de Plano Premium ou Passes.webm"
  },
  {
    "id": "03_profissional_06_aceitar_proposta_de_contratacao_01_enviar_curriculo_para_contratante",
    "profile": "Profissional",
    "module": "Aceitar Proposta de Contratação",
    "title": "Enviar Currículo para Contratante",
    "file": "03 - Profissional/06 - Aceitar Proposta de Contratação/01 - Enviar Currículo para Contratante.webm"
  },
  {
    "id": "03_profissional_06_aceitar_proposta_de_contratacao_02_aceitar_proposta_de_contratacao",
    "profile": "Profissional",
    "module": "Aceitar Proposta de Contratação",
    "title": "Aceitar proposta de contratação",
    "file": "03 - Profissional/06 - Aceitar Proposta de Contratação/02 - Aceitar proposta de contratação.webm"
  },
  {
    "id": "03_profissional_07_gestao_contratos_01_visualizar_contrato",
    "profile": "Profissional",
    "module": "Gestão Contratos",
    "title": "Visualizar contrato",
    "file": "03 - Profissional/07 - Gestão Contratos/01 - Visualizar contrato.webm"
  },
  {
    "id": "03_profissional_07_gestao_contratos_02_solicitar_cancelamento_e_desfazer_a_solicitacao",
    "profile": "Profissional",
    "module": "Gestão Contratos",
    "title": "Solicitar cancelamento e desfazer a solicitação",
    "file": "03 - Profissional/07 - Gestão Contratos/02 - Solicitar cancelamento e desfazer a solicitação.webm"
  },
  {
    "id": "03_profissional_07_gestao_contratos_03_recusar_pedido_de_cancelamento_de_contrato",
    "profile": "Profissional",
    "module": "Gestão Contratos",
    "title": "Recusar pedido de cancelamento de contrato",
    "file": "03 - Profissional/07 - Gestão Contratos/03 - Recusar pedido de cancelamento de contrato.webm"
  },
  {
    "id": "03_profissional_07_gestao_contratos_04_aceitar_solicitacao_de_cancelamento_e_consulta_cont",
    "profile": "Profissional",
    "module": "Gestão Contratos",
    "title": "Aceitar solicitação de cancelamento e consulta contrato cancelado",
    "file": "03 - Profissional/07 - Gestão Contratos/04 - Aceitar solicitação de cancelamento e consulta contrato cancelado.webm"
  },
  {
    "id": "03_profissional_07_gestao_contratos_05_liberar_o_gps_o_tempo_todo_para_registro_de_ponto",
    "profile": "Profissional",
    "module": "Gestão Contratos",
    "title": "Liberar o GPS o tempo todo para registro de ponto",
    "file": "03 - Profissional/07 - Gestão Contratos/05 - Liberar o GPS o tempo todo para registro de ponto.webm"
  },
  {
    "id": "03_profissional_08_gestao_de_tarefas_01_criar_concluir_e_excluir_tarefas_para_meu_assistid",
    "profile": "Profissional",
    "module": "Gestão de Tarefas",
    "title": "Criar, concluir e excluir tarefas para meu assistido",
    "file": "03 - Profissional/08 - Gestão de Tarefas/01- Criar, concluir e excluir tarefas para meu assistido.webm"
  },
  {
    "id": "03_profissional_09_gestao_de_contas_01_acessar_tela_pra_contratacao_de_planos_e_passes",
    "profile": "Profissional",
    "module": "Gestão de Contas",
    "title": "Acessar tela pra contratação de planos e passes",
    "file": "03 - Profissional/09 - Gestão de Contas/01 - Acessar tela pra contratação de planos e passes.webm"
  },
  {
    "id": "03_profissional_09_gestao_de_contas_02_desativar_conta",
    "profile": "Profissional",
    "module": "Gestão de Contas",
    "title": "Desativar conta",
    "file": "03 - Profissional/09 - Gestão de Contas/02 - Desativar conta.webm"
  },
  {
    "id": "03_profissional_09_gestao_de_contas_03_excluir_conta_definitivamente",
    "profile": "Profissional",
    "module": "Gestão de Contas",
    "title": "Excluir conta definitivamente",
    "file": "03 - Profissional/09 - Gestão de Contas/03 - Excluir conta definitivamente.webm"
  },
  {
    "id": "03_profissional_10_configuracoes_do_sistema_01_alterar_senha_login_biometria",
    "profile": "Profissional",
    "module": "Configurações do Sistema",
    "title": "Alterar senha Login biometria",
    "file": "03 - Profissional/10 - Configurações do Sistema/01 - Alterar senha_Login biometria.webm"
  },
  {
    "id": "03_profissional_11_central_de_mensagens_01_gestao_de_mensagens_na_central_de_mensagens",
    "profile": "Profissional",
    "module": "Central de Mensagens",
    "title": "Gestão de mensagens na central de mensagens",
    "file": "03 - Profissional/11 - Central de Mensagens/01 - Gestão de mensagens na central de mensagens.webm"
  },
  {
    "id": "03_profissional_12_ponto_por_geolocalizacao_01_autorizar_gps_o_tempo_todo_primeiro_login_a",
    "profile": "Profissional",
    "module": "Ponto por Geolocalização",
    "title": "Autorizar GPS o tempo todo (primeiro login após contrato ativo)",
    "file": "03 - Profissional/12 - Ponto por Geolocalização/01 - Autorizar GPS o tempo todo (primeiro login após contrato ativo).webm"
  },
  {
    "id": "03_profissional_12_ponto_por_geolocalizacao_02_aviso_de_registro_de_ponto",
    "profile": "Profissional",
    "module": "Ponto por Geolocalização",
    "title": "Aviso de registro de ponto",
    "file": "03 - Profissional/12 - Ponto por Geolocalização/02 - Aviso de registro de ponto.webm"
  },
  {
    "id": "03_profissional_12_ponto_por_geolocalizacao_03_aviso_de_atraso",
    "profile": "Profissional",
    "module": "Ponto por Geolocalização",
    "title": "Aviso de atraso",
    "file": "03 - Profissional/12 - Ponto por Geolocalização/03 - Aviso de atraso.webm"
  },
  {
    "id": "03_profissional_12_ponto_por_geolocalizacao_04_registrar_ponto_dentro_do_perimetro_de_trab",
    "profile": "Profissional",
    "module": "Ponto por Geolocalização",
    "title": "Registrar ponto dentro do perímetro de trabalho",
    "file": "03 - Profissional/12 - Ponto por Geolocalização/04 - Registrar ponto dentro do perímetro de trabalho.webm"
  },
  {
    "id": "03_profissional_12_ponto_por_geolocalizacao_05_registro_de_ponto_fora_de_horario",
    "profile": "Profissional",
    "module": "Ponto por Geolocalização",
    "title": "Registro de ponto fora de horário",
    "file": "03 - Profissional/12 - Ponto por Geolocalização/05 - Registro de ponto fora de horário.webm"
  },
  {
    "id": "03_profissional_12_ponto_por_geolocalizacao_06_registrar_ponto_fora_do_perimero_de_trabalh",
    "profile": "Profissional",
    "module": "Ponto por Geolocalização",
    "title": "Registrar ponto fora do perímero de trabalho",
    "file": "03 - Profissional/12 - Ponto por Geolocalização/06 - Registrar ponto fora do perímero de trabalho.webm"
  },
  {
    "id": "03_profissional_12_ponto_por_geolocalizacao_07_registro_de_falta",
    "profile": "Profissional",
    "module": "Ponto por Geolocalização",
    "title": "Registro de falta",
    "file": "03 - Profissional/12 - Ponto por Geolocalização/07 - Registro de falta.webm"
  },
  {
    "id": "03_profissional_12_ponto_por_geolocalizacao_08_aviso_de_registro_de_ponto_saida",
    "profile": "Profissional",
    "module": "Ponto por Geolocalização",
    "title": "Aviso de registro de ponto saída",
    "file": "03 - Profissional/12 - Ponto por Geolocalização/08 - Aviso de registro de ponto saída.webm"
  },
  {
    "id": "03_profissional_12_ponto_por_geolocalizacao_09_registrar_ponto_com_mais_de_um_contrato",
    "profile": "Profissional",
    "module": "Ponto por Geolocalização",
    "title": "Registrar ponto com mais de um contrato",
    "file": "03 - Profissional/12 - Ponto por Geolocalização/09 - Registrar ponto com mais de um contrato.webm"
  },
  {
    "id": "03_profissional_12_ponto_por_geolocalizacao_10_registro_de_ausencia",
    "profile": "Profissional",
    "module": "Ponto por Geolocalização",
    "title": "Registro de ausência",
    "file": "03 - Profissional/12 - Ponto por Geolocalização/10 - Registro de ausência.webm"
  },
  {
    "id": "03_profissional_13_gestao_de_ponto_01_espelho_de_ponto",
    "profile": "Profissional",
    "module": "Gestão de Ponto",
    "title": "Espelho de ponto",
    "file": "03 - Profissional/13 - Gestão de Ponto/01 - Espelho de ponto.webm"
  },
  {
    "id": "03_profissional_14_gestao_de_reembolsos_01_lanamento_de_reembolso",
    "profile": "Profissional",
    "module": "Gestão de Reembolsos",
    "title": "Lanamento de reembolso",
    "file": "03 - Profissional/14 - Gestão de Reembolsos/01 - Lanamento de reembolso.webm"
  },
  {
    "id": "03_profissional_14_gestao_de_reembolsos_02_lancamento_aprovado_e_pago",
    "profile": "Profissional",
    "module": "Gestão de Reembolsos",
    "title": "Lançamento aprovado e pago",
    "file": "03 - Profissional/14 - Gestão de Reembolsos/02 - Lançamento aprovado e pago.webm"
  },
  {
    "id": "03_profissional_15_ajuda_e_suporte_01_duvidas_frequentes",
    "profile": "Profissional",
    "module": "Ajuda e Suporte",
    "title": "Dúvidas Frequentes",
    "file": "03 - Profissional/15 - Ajuda e Suporte/01 - Dúvidas Frequentes.webm"
  },
  {
    "id": "03_profissional_15_ajuda_e_suporte_02_termos_e_contrato_de_utilizacao_do_app",
    "profile": "Profissional",
    "module": "Ajuda e Suporte",
    "title": "Termos e Contrato de Utilização do APP",
    "file": "03 - Profissional/15 - Ajuda e Suporte/02 - Termos e Contrato de Utilização do APP.webm"
  },
  {
    "id": "03_profissional_15_ajuda_e_suporte_03_politica_de_privacidade",
    "profile": "Profissional",
    "module": "Ajuda e Suporte",
    "title": "Política de Privacidade",
    "file": "03 - Profissional/15 - Ajuda e Suporte/03 - Política de Privacidade.webm"
  },
  {
    "id": "03_profissional_15_ajuda_e_suporte_04_falar_com_suporte",
    "profile": "Profissional",
    "module": "Ajuda e Suporte",
    "title": "Falar com Suporte",
    "file": "03 - Profissional/15 - Ajuda e Suporte/04 - Falar com Suporte.webm"
  },
  {
    "id": "03_profissional_15_ajuda_e_suporte_05_ouvidoria",
    "profile": "Profissional",
    "module": "Ajuda e Suporte",
    "title": "Ouvidoria",
    "file": "03 - Profissional/15 - Ajuda e Suporte/05 - Ouvidoria.webm"
  },
  {
    "id": "03_profissional_15_ajuda_e_suporte_06_sair_do_app",
    "profile": "Profissional",
    "module": "Ajuda e Suporte",
    "title": "Sair do App",
    "file": "03 - Profissional/15 - Ajuda e Suporte/06 - Sair do App.webm"
  },
  {
    "id": "03_profissional_15_ajuda_e_suporte_06_sobre_o_app_angel1s_care",
    "profile": "Profissional",
    "module": "Ajuda e Suporte",
    "title": "Sobre o App Angel1s Care",
    "file": "03 - Profissional/15 - Ajuda e Suporte/06 - Sobre o App Angel1s Care.webm"
  },
  {
    "id": "03_profissional_16_sair_do_app_01_sair_do_app",
    "profile": "Profissional",
    "module": "Sair do App",
    "title": "Sair do App",
    "file": "03 - Profissional/16 - Sair do App/01- Sair do App.webm"
  }
];

export const TUTORIAL_PROFILES: TutorialProfile[] = [
  "Comum",
  "Contratante",
  "Profissional",
];

export function tutorialModulesFor(profile: TutorialProfile | "todos"): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const item of TUTORIAL_CATALOG) {
    if (profile !== "todos" && item.profile !== profile) continue;
    if (seen.has(item.module)) continue;
    seen.add(item.module);
    list.push(item.module);
  }
  return list;
}
