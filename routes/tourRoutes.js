const express = require('express');
const toursController = require('./../controllers/toursController');
const authController = require('./../controllers/authController');
const reviewRoutes = require('./reviewRoutes');

const tourRouter = express.Router();

tourRouter.use('/:tourId/reviews',reviewRoutes);

tourRouter.route('/within/:distance/center/:latlng/unit/:unit').get(toursController.getToursWithin);
tourRouter.route('/distance/:latlng/unit/:unit').get(toursController.getToursDistance);
tourRouter.route('/top').get(toursController.getTop);
tourRouter.route('/status').get(toursController.getToursStatus);
tourRouter.route('/plan/:year').get(toursController.getMonthlyPlan);
tourRouter.route('/').get(authController.checkLoggedIn,toursController.getAllTours).post(authController.checkAdminLoggedIn,toursController.createTour);
tourRouter.route('/:id').get(toursController.getTourById).patch(authController.checkAdminLoggedIn,toursController.updateTour).delete(authController.checkAdminLoggedIn,toursController.deleteTour);


module.exports = tourRouter;