const EarthMineConfig ={
    serviceUrl : "https://localhost:5001/service",
    baseDataUrl : "https://localhost:5001/www",
    showcoverage : 0,
    CoverageLevel : 0, //0:Normal; 1:Yüksek çözünürlük; -1:Düşük çözünürlük
    usecoverageurl : true,//UseCoverageURL kullanılmak isteniyorsa true olmalıdır, false yapılırsa global sunucu kullanılacaktır.
    coverageDataUrl : "https://localhost:5001/map",
    spatiallayerdistance : 50,
    TableNameTabela : "Tabela",
    TableNameBillboard : "Pano",
    apiKey : "-",
    secretKey : "-",
    globalcoverageDataUrl : "-"
}

export default EarthMineConfig