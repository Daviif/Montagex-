-- =====================================================
-- MIGRAÇÃO: Código do serviço
-- Data: 2026-02-13
-- Descrição: Adiciona campo codigo_servico na tabela servicos
-- =====================================================

ALTER TABLE servicos
ADD COLUMN IF NOT EXISTS codigo_servico VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_servicos_codigo ON servicos(codigo_servico);

COMMENT ON COLUMN servicos.codigo_servico IS 'Código ou identificador do serviço';

DO $$
BEGIN
    RAISE NOTICE 'Migração concluída: servicos.codigo_servico';
END $$;
