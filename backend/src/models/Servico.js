module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Servico', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    data_servico: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    tipo_cliente: {
      type: DataTypes.STRING(20)
    },
    loja_id: {
      type: DataTypes.UUID
    },
    cliente_particular_id: {
      type: DataTypes.UUID
    },
    endereco_execucao: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    latitude: {
      type: DataTypes.DECIMAL(9, 6)
    },
    longitude: {
      type: DataTypes.DECIMAL(9, 6)
    },
    prioridade: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    janela_inicio: {
      type: DataTypes.TIME
    },
    janela_fim: {
      type: DataTypes.TIME
    },
    valor_total: {
      type: DataTypes.DECIMAL(10, 2)
    },
    status: {
      type: DataTypes.STRING(20)
    },
    observacoes: {
      type: DataTypes.TEXT
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'servicos',
    timestamps: false
  });
};
