import { Menu, Option, OptionGroup } from '../types/dashboard';

const img = (color: string, label: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="${color}"/><text x="50%" y="50%" fill="white" font-family="sans-serif" font-size="28" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`,
  );

const ADDITIONS: [string, number][] = [
  ['Ovo', 2],
  ['Salsicha', 2],
  ['Carne Tradicional', 3],
  ['Carne Artesanal 100g', 6.5],
  ['Carne Artesanal 150g', 7.5],
  ['Frango Desfiado', 4],
  ['Calabresa', 2.5],
  ['Bacon Cubo', 2.5],
  ['Bacon Fatiado', 3.5],
  ['Presunto', 2],
  ['Mussarela', 2.5],
  ['Batata Palha', 1.5],
  ['Salada', 1.5],
  ['Milho', 1.5],
  ['Cheddar Tradicional', 3],
  ['Cheddar Cremoso', 4],
  ['Catupiry', 2.5],
  ['Molho Rosé', 1],
  ['Cebola Caramelizada', 3],
  ['Maionese Verde', 1.5],
  ['Molho Barbecue', 1.5],
];

/** Grupo "Escolha seu Pão": obrigatório, uma opção. */
const breadGroup = (id: number): OptionGroup => ({
  id,
  name: 'Escolha seu Pão',
  type: 'single',
  min: 1,
  max: 1,
  maxPerOption: 1,
  options: [
    { id: id * 100 + 1, name: 'Tradicional', price: 2.5, available: true },
    { id: id * 100 + 2, name: 'Brioche', price: 3, available: true },
  ],
});

/** Grupo "Adicionais no Lanche": várias opções com quantidade, mínimo configurável. */
const additionsGroup = (id: number, min: number): OptionGroup => ({
  id,
  name: 'Adicionais no Lanche',
  type: 'multiple',
  min,
  max: 20,
  maxPerOption: 10,
  options: ADDITIONS.map(
    ([name, price], index): Option => ({ id: id * 100 + index + 1, name, price, available: true }),
  ),
});

export const MOCK_MENU: Menu = {
  store: {
    name: 'LA CASA HAMBURGUERIA',
    address: 'Rua Percelina Tolentino, 296 - Espinosa - Espinosa/MG',
    openingHours: '18:50 - 23:00',
    isOpen: true,
    deliveryTime: '50min - 1h 0min',
    takeoutTime: '45min',
    deliveryFee: 5, // valor fictício do mock
    minOrderValue: 10, // valor fictício do mock
    logoUrl: img('#b91c1c', 'LC'),
    phone: '(38) 99262-7635',
    whatsapp: '5538992627635',
    instagram: 'lacasa_hamburgueria_',
    latitude: -14.9284137,
    longitude: -42.8171793,
    hours: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day) => ({
      day,
      open: '18:50',
      close: '23:00',
    })),
    paymentMethods: [
      { type: 'pix', label: 'Pix' },
      { type: 'card', label: 'Cartão' },
      { type: 'cash', label: 'Dinheiro' },
    ],
  },
  categories: [
    {
      id: 1,
      name: 'HAMBURGUES TRADICIONAIS',
      products: [
        { id: 101, name: 'Misto simples', description: 'Pão, 2x queijo, 2x presunto', price: 10, startingPrice: null, imageUrl: null, available: true, featured: false, optionGroups: [] },
        { id: 108, name: 'Misto especial', description: 'Pão, ovo, presunto, queijo, milho, alface e tomate', price: 10, startingPrice: null, imageUrl: null, available: true, featured: false, optionGroups: [additionsGroup(1081, 3)] },
        { id: 102, name: 'Monte seu lanche', description: null, price: 0, startingPrice: 5.5, imageUrl: null, available: true, featured: false, optionGroups: [breadGroup(1021), additionsGroup(1022, 3)] },
        { id: 103, name: 'X Salada', description: 'Pão, carne, presunto, queijo, milho, alface e tomate.', price: 11, startingPrice: null, imageUrl: null, available: true, featured: false, optionGroups: [] },
        { id: 104, name: 'Laçador', description: 'Pão, carne, frango desfiado, salsicha, queijo, milho, alface e tomate.', price: 14.5, startingPrice: null, imageUrl: null, available: true, featured: false, optionGroups: [] },
        { id: 105, name: 'X Tudo', description: 'Pão, carne, salsicha, ovo, presunto, queijo, bacon, milho, alface e tomate.', price: 16, startingPrice: null, imageUrl: null, available: true, featured: false, optionGroups: [] },
        { id: 106, name: 'Combo 2x X Tudo + Coca 600ml', description: null, price: 37.99, startingPrice: null, imageUrl: null, available: false, featured: false, optionGroups: [] },
        { id: 107, name: 'La Casa', description: 'Pão, 2x carne, frango desfiado, salsicha, ovo, bacon, presunto, queijo, calabresa, milho, alface e tomate.', price: 22, startingPrice: null, imageUrl: null, available: true, featured: false, optionGroups: [] },
      ],
    },
    {
      id: 2,
      name: 'HAMBURGUES ARTESANAIS',
      products: [
        { id: 201, name: 'Toquio', description: 'Pão brioche, hambúrguer 150g, cheddar cremoso, bacon fatiado, barbecue, cebola caramelizada, maionese especial, alface e tomate.', price: 23, startingPrice: null, imageUrl: img('#b45309', 'Toquio'), available: true, featured: false, optionGroups: [] },
        { id: 202, name: 'Helsinki', description: 'Pão brioche, hambúrguer 150g, 2x queijo mussarela, bacon fatiado, barbecue, cebola caramelizada, maionese especial, alface e tomate.', price: 22, startingPrice: null, imageUrl: img('#92400e', 'Helsinki'), available: true, featured: false, optionGroups: [] },
        { id: 203, name: 'Rio', description: 'Pão brioche, hambúrguer 150g, bacon fatiado, barbecue, maionese especial, alface e tomate.', price: 17, startingPrice: null, imageUrl: null, available: true, featured: false, optionGroups: [] },
        { id: 204, name: 'Professor', description: 'Pão brioche, 3x hambúrguer 100g, 3x cheddar cremoso, 2x bacon fatiado, barbecue, maionese especial, alface e tomate.', price: 32, startingPrice: null, imageUrl: null, available: true, featured: false, optionGroups: [] },
        { id: 205, name: 'Monte seu lanche', description: null, price: 0, startingPrice: 7.5, imageUrl: null, available: true, featured: false, optionGroups: [breadGroup(2051), additionsGroup(2052, 5)] },
      ],
    },
    {
      id: 3,
      name: 'Porções',
      products: [
        { id: 301, name: 'Batata frita tradicional', description: '400g de batata', price: 20, startingPrice: null, imageUrl: null, available: true, featured: false, optionGroups: [] },
        { id: 302, name: 'Batata cheddar e bacon', description: null, price: 27, startingPrice: null, imageUrl: null, available: true, featured: false, optionGroups: [] },
        { id: 303, name: 'Combo Pasteis 12un fran/carn + guaraná 1l + taxa', description: null, price: 25, startingPrice: null, imageUrl: null, available: true, featured: true, optionGroups: [] },
        { id: 304, name: 'Pastéis 12 unidades sabor carne e frango', description: null, price: 19, startingPrice: null, imageUrl: null, available: true, featured: true, optionGroups: [] },
      ],
    },
    {
      id: 4,
      name: 'Refrigerantes e bebidas',
      products: [
        { id: 401, name: 'Guaraná Antártica 1L', description: null, price: 8, startingPrice: null, imageUrl: img('#15803d', 'Guaraná'), available: true, featured: false, optionGroups: [] },
        { id: 402, name: 'Coca-Cola 1L', description: null, price: 10, startingPrice: null, imageUrl: img('#b91c1c', 'Coca 1L'), available: true, featured: false, optionGroups: [] },
        { id: 403, name: 'Coca-Cola 2L', description: null, price: 14, startingPrice: null, imageUrl: img('#b91c1c', 'Coca 2L'), available: true, featured: false, optionGroups: [] },
        { id: 404, name: 'Água mineral 500ml', description: null, price: 3, startingPrice: null, imageUrl: img('#0369a1', 'Água'), available: true, featured: false, optionGroups: [] },
        { id: 405, name: 'Energético Monster 473ml', description: null, price: 12, startingPrice: null, imageUrl: null, available: true, featured: false, optionGroups: [] },
      ],
    },
    {
      id: 5,
      name: 'Variedades',
      products: [
        { id: 501, name: 'Halls morango', description: null, price: 2.5, startingPrice: null, imageUrl: null, available: true, featured: false, optionGroups: [] },
        { id: 502, name: 'Trident menta', description: null, price: 3, startingPrice: null, imageUrl: null, available: true, featured: false, optionGroups: [] },
      ],
    },
    { id: 6, name: 'Trufas', products: [] },
  ],
};