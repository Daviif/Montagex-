module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Loja', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    nome: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    telefone: {
      type: DataTypes.STRING(20)
    },
    email: {
      type: DataTypes.STRING(120)
    },
    endereco: {
      type: DataTypes.TEXT
    },
    prazo_pagamento_dias: {
      type: DataTypes.INTEGER
    },
    usa_porcentagem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    porcentagem_repasse: {
      type: DataTypes.DECIMAL(5, 2)
    },
    observacoes_pagamento: {
      type: DataTypes.TEXT
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'lojas',
    timestamps: false
  });
};
