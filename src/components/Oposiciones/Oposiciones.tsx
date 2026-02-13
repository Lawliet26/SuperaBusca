import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Select, Input, Empty, message, Row, Col, Spin, Pagination, Card, Tag, Button } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { oposicionesService } from '../../services/oposicionesService';
import { provinciasService, Provincia } from '../../services/provinciasService';
import { categoriasService, Categoria } from '../../services/categoriasService';
import { useAuth } from '../../context/AuthContext';
import { Oposicion } from '../../types';
import OposicionCard from './OposicionCard';
import './Oposiciones.css';

const { Option } = Select;

const TIPOS_OPOSICION = ['Convocatoria', 'Oferta'];

const Oposiciones: React.FC = () => {
  const { user } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();
  const [oposiciones, setOposiciones] = useState<Oposicion[]>([]);
  const [loading, setLoading] = useState(true);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  // Filtros
  const [categoriaFilter, setCategoriaFilter] = useState<number | null>(null);
  const [provinciaFilter, setProvinciaFilter] = useState<number | null>(null);
  const [tipoFilter, setTipoFilter] = useState<string>('Convocatoria');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);

  // Cargar catálogos (provincias y categorías)
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [provData, catData] = await Promise.all([
          provinciasService.getProvincias(),
          categoriasService.getCategorias()
        ]);
        setProvincias(provData);
        setCategorias(catData);
      } catch (error) {
        messageApi.error('Error al cargar los filtros');
      }
    };

    fetchCatalogs();
  }, []);

  // Cargar oposiciones con filtros
  useEffect(() => {
    fetchOposiciones();
  }, [currentPage, pageSize, categoriaFilter, provinciaFilter, tipoFilter, searchTerm]);

  const fetchOposiciones = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * pageSize;

      const filters = {
        search: searchTerm || undefined,
        provincia_id: provinciaFilter || undefined,
        categoria_id: categoriaFilter || undefined,
        tipo: tipoFilter || undefined,
        limit: pageSize,
        offset
      };

      const result = await oposicionesService.getOposicionesAdmin(filters);

      // Mapear los datos de OposicionAdmin a Oposicion
      const mappedOposiciones: Oposicion[] = result.data.map(item => ({
        id: item.id.toString(),
        titulo: item.titulo,
        descripcion: item.observaciones || `${item.nombre_categoria} - ${item.nombre_provincia}`,
        categoria: item.nombre_categoria,
        categoriaId: item.categoria_id,
        convocante: item.convocante,
        municipio_id: item.municipio_id,
        nombre_municipio: item.nombre_municipio,
        provincia: item.nombre_provincia,
        provinciaId: item.provincia_id,
        fechaConvocatoria: item.fecha_convocatoria,
        fechaFinalizacion: item.fecha_fin,
        plazas: item.num_plazas,
        estado: item.estado === 'Abierta' ? 'abierta' : item.estado === 'Cerrada' ? 'cerrada' : 'en curso',
        urlBasesOficiales: item.url_bases_oficiales,
        tieneTemarioListo: item.tiene_temario_listo
      }));


      setOposiciones(mappedOposiciones);
      setTotal(result.total);
    } catch (error) {
      messageApi.error('Error al cargar las oposiciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitarTemario = async (id: string) => {
    try {
      const payload = {
        user_id: parseInt(user?.id || '0'),
        oposicion_id: parseInt(id)
      };

      const response = await oposicionesService.compararTemario(payload);

      if (typeof response === 'string') {
        messageApi.info(response);
        return;
      }

    } catch (error) {
      messageApi.error('Error al solicitar el temario');
    }
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Resetear a la primera página cuando cambian los filtros
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoriaFilter(null);
    setProvinciaFilter(null);
    setTipoFilter('Oferta');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || categoriaFilter || provinciaFilter || (tipoFilter && tipoFilter !== 'Oferta');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <motion.div
      className="oposiciones-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {contextHolder}
      <div className="page-header">
        <motion.h1
          className="page-title"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          Oposiciones
        </motion.h1>
        <motion.p
          className="page-subtitle"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          Explora las convocatorias disponibles y solicita tu temario
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="filters-card">
          <div className="filters-row">
            <div className="filter-item search-filter">
              <Input
                placeholder="Buscar oposición..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleFilterChange();
                }}
                className="search-input"
                allowClear
              />
            </div>

            <div className="filter-item">
              <Select
                showSearch
                optionFilterProp="children"
                placeholder={
                  <span>
                    <FilterOutlined /> Tipo
                  </span>
                }
                value={tipoFilter || undefined}
                onChange={(value) => {
                  setTipoFilter(value);
                  handleFilterChange();
                }}
                allowClear
                className="filter-select"
              >
                {TIPOS_OPOSICION.map(tipo => (
                  <Option key={tipo} value={tipo}>{tipo}</Option>
                ))}
              </Select>
            </div>

            <div className="filter-item">
              <Select
                showSearch
                optionFilterProp="children"
                placeholder={
                  <span>
                    <FilterOutlined /> Provincia
                  </span>
                }
                value={provinciaFilter || undefined}
                onChange={(value) => {
                  setProvinciaFilter(value);
                  handleFilterChange();
                }}
                allowClear
                className="filter-select"
              >
                {provincias.map(prov => (
                  <Option key={prov.id} value={prov.id}>{prov.nombre}</Option>
                ))}
              </Select>
            </div>

            <div className="filter-item">
              <Select
                showSearch
                optionFilterProp="children"
                placeholder={
                  <span>
                    <FilterOutlined /> Categoría
                  </span>
                }
                value={categoriaFilter || undefined}
                onChange={(value) => {
                  setCategoriaFilter(value);
                  handleFilterChange();
                }}
                allowClear
                className="filter-select"
              >
                {categorias.map(cat => (
                  <Option key={cat.id} value={cat.id}>{cat.nombre}</Option>
                ))}
              </Select>
            </div>

            {hasActiveFilters && (
              <div>
                <Button onClick={clearFilters} size='large'>
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>

          <div className="results-info">
            <span className="results-count">
              {total} oposiciones encontradas
            </span>
            {hasActiveFilters && (
              <Tag color="blue">
                {[
                  searchTerm && 'Búsqueda',
                  tipoFilter && tipoFilter !== 'Oferta' && 'Tipo',
                  provinciaFilter && 'Provincia',
                  categoriaFilter && 'Categoría'
                ].filter(Boolean).join(', ')} activo(s)
              </Tag>
            )}
          </div>
        </Card>
      </motion.div>

      {loading ? (
        <div className="loading-container">
          <Spin size="large" tip="Cargando oposiciones..." />
        </div>
      ) : oposiciones.length > 0 ? (
        <>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Row gutter={[24, 24]}>
              {oposiciones.map((oposicion, index) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={oposicion.id}>
                  <OposicionCard
                    oposicion={oposicion}
                    index={index}
                    onSolicitarTemario={handleSolicitarTemario}
                  />
                </Col>
              ))}
            </Row>
          </motion.div>

          <div className="pagination-container">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={total}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size || 12);
              }}
              showSizeChanger
              showQuickJumper
              pageSizeOptions={['12', '24', '48']}
              showTotal={(total, range) => `${range[0]}-${range[1]} de ${total} oposiciones`}
              className="oposiciones-pagination"
            />
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="empty-container"
        >
          <Empty
            description={
              <span className="empty-text">
                No se encontraron oposiciones con los filtros seleccionados
              </span>
            }
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default Oposiciones;