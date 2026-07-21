# Generic multi-stage build for any service in this solution.
# Build context must be the services/ directory (so Shared.Contracts is available).
#   docker build -f services/Dockerfile --build-arg PROJECT=Orders/Orders.Api.csproj \
#     --build-arg DLL=Orders.Api.dll services/
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG PROJECT
WORKDIR /src
COPY . .
RUN dotnet restore "$PROJECT"
RUN dotnet publish "$PROJECT" -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
ARG DLL
WORKDIR /app
COPY --from=build /app .
ENV DLL_NAME=$DLL
# Bind to all interfaces inside the container (compose sets the port per service).
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["sh", "-c", "dotnet $DLL_NAME"]
