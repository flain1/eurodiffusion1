const fs = require('fs');

const parseInput = (input) => {
  const data = input.split('\n');
  const cases = [];

  let countryNumber = 0;
  let tempCase = { countries: [], countriesNames: [] };

  for (let element of data) {
    if (!isNaN(Number(element))) {
      countryNumber = Number(element);
      tempCase = { countries: [], countriesNames: [] };
      continue;
    }

    const countryData = element.split(' ');
    const countryName = countryData[0];
    const lowerX = Number(countryData[1]);
    const lowerY = Number(countryData[2]);
    const upperX = Number(countryData[3]);
    const upperY = Number(countryData[4]);

    if (typeof countryName !== 'string' || countryName.length > 25) {
      throw new Error('Erroneous country name');
    }
    if (isNaN(lowerX) || isNaN(lowerY) || isNaN(upperX) || isNaN(upperY)) {
      throw new Error('Erroneous country coordinates');
    }

    const country = {
      name: countryName,
      lowerX,
      lowerY,
      upperX,
      upperY,
      completionDay: -1,
      cities: [],
    };

    tempCase.countries.push(country);
    tempCase.countriesNames.push(countryName);

    countryNumber--;

    if (countryNumber === 0) {
      cases.push(tempCase);
    }
  }

  return cases;
};

const updateCitiesDayBalance = (caseX, map) => {
  for (const country of caseX.countries) {
    for (const cityCoordinates of country.cities) {
      const [x, y] = cityCoordinates;
      const city = map[x][y];
      const cityNeighborsCoordinates = [
        [x + 1, y],
        [x - 1, y],
        [x, y - 1],
        [x, y + 1],
      ];

      const validatedNeighborsCoordinates = cityNeighborsCoordinates.filter(coordinates => {
        const [x, y] = coordinates;
        return x >= 0 && y >= 0 && x < 10 && y < 10 && map[x][y];
      });

      const todayTransferMap = caseX.countriesNames.reduce((balance, countryName) => ({
        ...balance,
        [countryName]: Math.floor(city.balance[countryName] / 1000),
      }), {});

      validatedNeighborsCoordinates.forEach(coordinates => {
        const [x, y] = coordinates;
        const neighbor = map[x][y];
        const updatedNeighborDayBalance = caseX.countriesNames.reduce((dayBalance, countryName) => ({
          ...dayBalance,
          [countryName]: dayBalance[countryName] + todayTransferMap[countryName],
        }), neighbor.dayBalance);
        neighbor.dayBalance = updatedNeighborDayBalance;
      });

      const updatedCityBalance = caseX.countriesNames.reduce((balance, countryName) => ({
        ...balance,
        [countryName]: city.balance[countryName] - validatedNeighborsCoordinates.length * todayTransferMap[countryName],
      }), city.balance);
      city.balance = updatedCityBalance;
    }
  }
};

const updateCitiesBalance = (caseX, map) => {
  for (const country of caseX.countries) {
    for (const cityCoordinates of country.cities) {
      const [x, y] = cityCoordinates;
      const city = map[x][y];

      city.balance = Object.fromEntries(
        Object.entries(city.balance).map(([countryName, balance]) => {
          const updatedBalance = balance + (city.dayBalance[countryName] || 0);
          return [countryName, updatedBalance];
        })
      );

      city.dayBalance = Object.fromEntries(
        Object.entries(city.dayBalance).map(([countryName]) => [countryName, 0])
      );
    }
  }
};

const updateCountriesAndCitiesCompletion = (caseX, day, map) => {
  let isCaseComplete = true;

  for (const country of caseX.countries) {
    if (country.completionDay !== -1) continue;

    let isCountryComplete = true;

    for (const cityCoordinates of country.cities) {
      const [x, y] = cityCoordinates;
      const city = map[x][y];

      if (city.isComplete) continue;

      const isCityComplete = Object.values(city.balance).every(value => value !== 0);

      if (isCityComplete) {
        city.isComplete = true;
      } else {
        isCountryComplete = false;
        break;
      }
    }

    if (isCountryComplete) {
      country.completionDay = day;
    } else {
      isCaseComplete = false;
    }
  }

  return isCaseComplete;
};

const main = () => {
  const map = Array.from({ length: 10 }, () => Array.from({ length: 10 }));

  const input = fs.readFileSync('./input.txt', { encoding: 'utf8', flag: 'r' });
  const cases = parseInput(input);
  const answers = [];

  for (const case1 of cases) {
    for (const country of case1.countries) {
      for (let i = country.lowerX - 1; i < country.upperX; i++) {
        for (let j = country.lowerY - 1; j < country.upperY; j++) {
          const cityBalance = case1.countriesNames.reduce((balance, countryName) => ({
            ...balance,
            [countryName]: countryName === country.name ? 1000000 : 0
          }), {});

          const initDayBalance = case1.countriesNames.reduce((balance, countryName) => ({
            ...balance,
            [countryName]: 0
          }), {});

          map[j][i] = {
            country: country.name,
            isComplete: false,
            balance: cityBalance,
            dayBalance: initDayBalance
          };
          country.cities.push([j, i]);
        }
      }
    }

    let isCaseComplete = false;
    let daysPassed = 1;

    while (!isCaseComplete) {
      updateCitiesDayBalance(case1, map);
      updateCitiesBalance(case1, map);
      isCaseComplete = updateCountriesAndCitiesCompletion(case1, daysPassed, map);
      daysPassed++;
    }

    answers.push(case1);
  }

  const sortedAnswers = answers.map(caseX => {
    return caseX.countries.sort((a, b) => b.completionDay - a.completionDay);
  });

  sortedAnswers.forEach((caseX, index) => {
    console.log(`Case Number ${index + 1}: `)
    caseX.forEach((country) => {
      console.log(`${country.name}: ${country.completionDay}`)
    })

    console.log('')
  }) 
};

main();
