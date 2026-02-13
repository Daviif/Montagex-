module.exports = (sequelize, DataTypes) => {
  return sequelize.define('PagamentoFuncionario', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    usuario_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    servico_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    valor: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    data_pagamento: {
      type: DataTypes.DATEONLY
    },
    status: {
      type: DataTypes.STRING(20)
    }
  }, {
    tableName: 'pagamentos_funcionarios',
    timestamps: false
  });
};
