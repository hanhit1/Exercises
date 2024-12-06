import express, { Request, Response, Application } from 'express';
import 'reflect-metadata';

const metadata: {
  [key: string]: { baseRoute: string; routes: Array<{ method: string; route: string; handler: Function }> };
} = {};

const controllerRegistry: { [key: string]: { new (): any } } = {};

function Controller(baseRoute: string) {
  return function (target: Function) {
    const controllerName = target.name;

    if (!metadata[controllerName]) {
      metadata[controllerName] = { baseRoute, routes: [] };
    } else {
      metadata[controllerName].baseRoute = baseRoute;
    }

    controllerRegistry[controllerName] = target as { new (): any };
  };
}


function createMethodDecorator(method: string) {
  return function (route: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const controllerName = target.constructor.name;

      if (!metadata[controllerName]) {
        metadata[controllerName] = { baseRoute: '', routes: [] };
      }

      metadata[controllerName].routes.push({
        method,
        route,
        handler: descriptor.value,
      });
    };
  };
}

const Get = createMethodDecorator('get');
const Post = createMethodDecorator('post');
const Patch = createMethodDecorator('patch');
const Put = createMethodDecorator('put');

function bootstrap(app: Application) {
  for (const controllerName in metadata) {
    const { baseRoute, routes } = metadata[controllerName];
    const ControllerClass = controllerRegistry[controllerName];
    const instance = new ControllerClass();
    const router = express.Router();

    routes.forEach(({ method, route, handler }) => {
   (router as any)[method](route, handler.bind(instance));
    });

    app.use(baseRoute, router);
  }
}


@Controller('/users')
class UserController {
  @Get('/')
  findAll(req: Request, res: Response) {
    res.send('Get all users');
  }

  @Post('/')
  create(req: Request, res: Response) {
    res.send('Create a new user');
  }

  @Patch('/:id')
  update(req: Request, res: Response) {
    res.send(`Update user with id ${req.params.id}`);
  }
}

const app: Application = express();
bootstrap(app);
app.listen(3000, () => console.log('Server is running on port 3000'));
