const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const Usuario = require('./Usuario')(sequelize, Sequelize.DataTypes);
const Equipe = require('./Equipe')(sequelize, Sequelize.DataTypes);
const EquipeMembro = require('./EquipeMembro')(sequelize, Sequelize.DataTypes);
const Loja = require('./Loja')(sequelize, Sequelize.DataTypes);
const ClienteParticular = require('./ClienteParticular')(sequelize, Sequelize.DataTypes);
const Produto = require('./Produto')(sequelize, Sequelize.DataTypes);
const Servico = require('./Servico')(sequelize, Sequelize.DataTypes);
const ServicoProduto = require('./ServicoProduto')(sequelize, Sequelize.DataTypes);
const Rota = require('./Rota')(sequelize, Sequelize.DataTypes);
const RotaServico = require('./RotaServico')(sequelize, Sequelize.DataTypes);
const Recebimento = require('./Recebimento')(sequelize, Sequelize.DataTypes);
const PagamentoFuncionario = require('./PagamentoFuncionario')(sequelize, Sequelize.DataTypes);
const Despesa = require('./Despesa')(sequelize, Sequelize.DataTypes);

Equipe.hasMany(EquipeMembro, { foreignKey: 'equipe_id' });
EquipeMembro.belongsTo(Equipe, { foreignKey: 'equipe_id' });

Usuario.hasMany(EquipeMembro, { foreignKey: 'usuario_id' });
EquipeMembro.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Loja.hasMany(Servico, { foreignKey: 'loja_id' });
ClienteParticular.hasMany(Servico, { foreignKey: 'cliente_particular_id' });
Servico.belongsTo(Loja, { foreignKey: 'loja_id' });
Servico.belongsTo(ClienteParticular, { foreignKey: 'cliente_particular_id' });

Servico.hasMany(ServicoProduto, { foreignKey: 'servico_id' });
Produto.hasMany(ServicoProduto, { foreignKey: 'produto_id' });
ServicoProduto.belongsTo(Servico, { foreignKey: 'servico_id' });
ServicoProduto.belongsTo(Produto, { foreignKey: 'produto_id' });

Equipe.hasMany(Rota, { foreignKey: 'equipe_id' });
Rota.belongsTo(Equipe, { foreignKey: 'equipe_id' });

Rota.hasMany(RotaServico, { foreignKey: 'rota_id' });
Servico.hasMany(RotaServico, { foreignKey: 'servico_id' });
RotaServico.belongsTo(Rota, { foreignKey: 'rota_id' });
RotaServico.belongsTo(Servico, { foreignKey: 'servico_id' });

Servico.hasMany(Recebimento, { foreignKey: 'servico_id' });
Recebimento.belongsTo(Servico, { foreignKey: 'servico_id' });

Usuario.hasMany(PagamentoFuncionario, { foreignKey: 'usuario_id' });
Servico.hasMany(PagamentoFuncionario, { foreignKey: 'servico_id' });
PagamentoFuncionario.belongsTo(Usuario, { foreignKey: 'usuario_id' });
PagamentoFuncionario.belongsTo(Servico, { foreignKey: 'servico_id' });

Servico.hasMany(Despesa, { foreignKey: 'servico_id' });
Rota.hasMany(Despesa, { foreignKey: 'rota_id' });
Despesa.belongsTo(Servico, { foreignKey: 'servico_id' });
Despesa.belongsTo(Rota, { foreignKey: 'rota_id' });

module.exports = {
  sequelize,
  Sequelize,
  models: {
    Usuario,
    Equipe,
    EquipeMembro,
    Loja,
    ClienteParticular,
    Produto,
    Servico,
    ServicoProduto,
    Rota,
    RotaServico,
    Recebimento,
    PagamentoFuncionario,
    Despesa
  }
};
